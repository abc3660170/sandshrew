import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import path from "path";
import { rimraf } from "rimraf";
import fs, { mkdirSync } from "fs";
import extractZip from "extract-zip";
import { spawn, ChildProcess } from "child_process";
import { isBusy, getEnvs, spawnWrap, getLocalNpmConfig } from "../utils/utils.ts";
import { fileURLToPath } from "url";
let localNpmThread: ChildProcess | null = null;

async function cutoff(fastify: FastifyInstance, options: {
  workspace: string;
}): Promise<void> {
  // 关闭协local-npm
  localNpmThread && localNpmThread.kill("SIGINT");
  localNpmThread = null;
  // 清理上传目录
  // await clean(options.uploadsFolder);
  // 清理工作目录
  await clean(fastify, options.workspace);
  fastify.globalState.npmUploding = false;
}

export default async (fastify: FastifyInstance, options: { routePrefix: string }) => {
  const tmp = fastify.REGISTER_CONFIG.tmp;
  const uploadsFolder = path.resolve(tmp, "./uploads");
  const workspace = tmp;
  let errors: string[] = [];
  fastify.get(`${options.routePrefix}/close`, async (_: FastifyRequest, reply: FastifyReply) => {
    await cutoff(fastify, {workspace});
    reply.send("shutdown force!");
  });   

  fastify.post(`${options.routePrefix}/upload`, async (request: FastifyRequest, reply: FastifyReply) => {
    if (isBusy(fastify)) {
      return reply.status(226).send({ errors: ["有人在用，你先等等还行啊！"] });
    } else {
      fastify.globalState.npmUploding = true
      const data = (request.body as { file: Buffer }).file;
      if(!data) {
        return endReq(fastify, reply, 500, ["文件上传失败！"]);
      }
      clean(fastify, workspace);
      mkdirSync(uploadsFolder, { recursive: true });
      const file = await writeFile(`${uploadsFolder}/upload.zip`, data)
      await cleanCache();
      await restartVerdaccio();
      // 启动协local-npm(强制成功，不会抛异常)
      localNpmThread = await StartLocalNpmThread(fastify, workspace);
      try {
        // 解压上传后的附件
        const ws = await unzipFile(fastify, file, workspace);
        // 本地安装
        await localInstall(fastify, ws);
      } catch (error) {
        errors = Array.isArray(error) ? error : [error.toString()];
        fastify.log.error("========= localInstall安装异常 ==========");
        fastify.log.error(errors);
      } finally {
        localNpmThread.kill("SIGINT");
        await cutoff(fastify, { workspace });
        if (errors.length > 0) {
          return endReq(fastify, reply, 500, errors);
        }
        return reply.send({
          errors,
          code: 200,
        });
      }
    }
  });
};

const writeFile = (file: string, data: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    fs.writeFile(file, data, (err) => {
      return err ? reject(err) : resolve(file);
    });
  });
};

function endReq(fastify: FastifyInstance, reply: FastifyReply, code: number, errors: string[] = []) {
  fastify.globalState.npmUploding  = false;
  return reply.status(code).send({ code, errors });
}

async function unzipFile(fastify: FastifyInstance, file: string, workspace: string): Promise<string> {
  // 清理工作目录
  await clean(fastify, workspace);
  // 解压文件到工作目录
  await extractZip(file, { dir: workspace });
  return workspace;
}

async function restartVerdaccio(): Promise<void> {
  // 在windows平台上什么都不用做，说明未部署到服务器呢
  if (/^win/.test(process.platform)) {
    return Promise.resolve();
  }
  await spawnWrap("pm2", ["restart", "pelipper"]);
}

async function StartLocalNpmThread(fastify: FastifyInstance, workspace: string): Promise<ChildProcess> {
  return new Promise((resolve) => {
    const thread = spawn("node", ["local-npm.js"], { 
      cwd: path.resolve(fileURLToPath(import.meta.url), "../../spawn"),
      env: Object.assign({}, process.env, {
        CONFIG: JSON.stringify(getLocalNpmConfig(fastify)),
        NPM_TYPE: 'push',
        CWD: workspace
      })
    });
    thread.stderr.on("data", (data) => {
      fastify.log.error(`local-npm:stderr: ${data}`);
    });
    thread.stdout.on("data", (data) => {
      fastify.log.info(`local-npm:stdout: ${data}`);
    });
    thread.on("close", () => {
      fastify.log.info("========================================");
      fastify.log.info("=========== local-npm 熄火了 ============");
      fastify.log.info("========================================");
    });
    // setTimeout(() => {
      resolve(thread);
    // }, 2000);
  });
}

async function cleanCache(): Promise<void> {
  await spawnWrap(/^win/.test(process.platform) ? "npm.cmd" : "npm", [
    "cache",
    "clean",
    "--force",
  ], {
    ignoreErrors: true
  });
}

async function localInstall(fastify: FastifyInstance, ws: string): Promise<void> {
  const projectCwd = path.resolve(ws, "project");
  const errors: string[] = [];

  // 将范围版本号替换为精准版本号
  try {
    const pkgFile = path.resolve(projectCwd, "package.json");
    let content = fs.readFileSync(pkgFile, "utf-8");
    content = content.replace(/[\^|\~]/g, "");
    fs.writeFileSync(pkgFile, content, "utf-8");
  } catch (error) {
    throw error;
  }

  // 开始安装
  const args = ["install", "--force", "--unsafe-perm", "--ignore-scripts", ...getEnvs(fastify, 'push')];
  fastify.log.info(`---------------npm install的全部参数：---------------`);
  fastify.log.info(args);

  const thread = spawn(
    /^win/.test(process.platform) ? "npm.cmd" : "npm",
    args,
    { cwd: projectCwd }
  );

  return new Promise<void>((resolve, reject) => {
    thread.stderr.on("data", (data) => {
      fastify.log.error(`install:stderr: ${data}`);
      // 如果主机停机了，直接退出安装
      if (!checkVerdaccioHealthy(data.toString())) {
        errors.push(data.toString());
        thread.kill("SIGINT");
      } else if (!checkHealthy(data.toString())) {
        errors.push(data.toString());
      }
    });

    thread.stdout.on("data", (data) => {
      fastify.log.info(`install:stdout: ${data}`);
    });

    thread.on("close", () => {
      if (errors.length > 0) {
        reject(errors);
      } else {
        resolve();
      }
    });

    thread.on("aborted", (error) => {
      fastify.log.error(`系统超时退出了: ${error}`);
      reject(error);
    });
  });
}

async function clean(fastify: FastifyInstance, folder: string): Promise<void> {
  try {
    await rimraf(`${folder}/*`);
  } catch (err) {
    fastify.log.error(`清理文件夹失败:${folder}`);
    throw new err;
  }
}

function checkHealthy(message: string): boolean {
  const keywords = [
    "ERR!", // 可能是下载的对应的包不存在
  ];
  return !keywords.some((keyword) => {
    return message.includes(keyword);
  });
}

function checkVerdaccioHealthy(message: string): boolean {
  const keywords = [
    "ECONNREFUSED", // 可能是主机关掉了
  ];
  return !keywords.some((keyword) => {
    return message.includes(keyword);
  });
}
