var express = require("express");
var router = express.Router();
var multer = require("multer");
var path = require("path");
var rimraf = require("rimraf");
var fs = require("fs");
var extractZip = require("extract-zip");
const { spawn } = require("child_process");
const { isBusy, getEnvs } = require("../utils/utils");
var app = express();

var upload = multer({ dest: "uploads/" });
const uploadsFolder = path.resolve(__dirname, "../uploads");
const workspace = path.resolve(__dirname, "../tmp");
let localNpmThread = null;

async function cutoff() {
  // 关闭协local-npm
  localNpmThread && localNpmThread.kill("SIGINT");

  localNpmThread = null;

  // 清理上传目录
  await clean(uploadsFolder);

  // 清理工作目录
  await clean(workspace);

  process.env.NPM_UPLOAD = false;
}

router.get("/close", async function (req, res, next) {
  await cutoff();
  res.end("shutdown force!");
});

router.post("/upload", upload.single("file"), async function (req, res, next) {
  if(isBusy()){
    res.json({ code: 226, errors: ["有人在用，你先等等还行啊！"] });
  } else {
    process.env.NPM_UPLOAD = true;
    const file = req.file.path;
    let ws,
      errors = [];
    try {
      // 解压上传后的附件
      ws = await unzipFile(file);
    } catch (error) {
      return endReq(res, 500, ["文件解压失败！"]);
    }
    await cleanCache();

    await restartVerdaccio();

    // 启动协local-npm
    localNpmThread = await StartLocalNpmThread();

    try {
      // 本地安装
      await localInstall(ws);
    } catch (error) {
      errors = Array.isArray(error) ? error : [error.toString()];
      console.log("========= localInstall安装异常 ==========");
      console.error(errors);
    } finally {
      await cutoff();

      if (errors.length > 0) {
        endReq(res, 500, errors);
      } else {
        endReq(res, 200);
      }
    }
  }
});

function endReq(res, code, errors = []) {
  process.env.NPM_UPLOAD = false;
  res.json({ errors, code });
}

/**
 * 解压文件到当前文件夹
 * @param {*} file
 */
async function unzipFile(file) {
  // 清理工作目录
  await clean(workspace);
  // 解压文件到工作目录
  await extractZip(file, { dir: workspace });
  return workspace;
}

/**
 * 重启在同一台服务器上的 Verdaccio 服务器
 */
async function restartVerdaccio() {
  // 在windows平台上什么都不用做，说明未部署到服务器呢
  if (/^win/.test(process.platform)) {
    return Promise.resolve();
  }
  return await spawnWrap("pm2", ["restart", "pelipper"]);
}

/**
 * 启动本地npm服务
 */
async function StartLocalNpmThread() {
  const cwd = path.resolve(__dirname, "../");
  return new Promise((resolve) => {
    const thread = spawn("node", ["build/local-npm.js"], { 
      cwd,
      env: Object.assign({}, process.env, {
        NPM_TYPE: 'push'
      })
    });
    thread.stderr.on("data", (data) => {
      console.log(`npm:stderr: ${data}`);
    });
    thread.stdout.on("data", (data) => {
      console.log(`npm:stdout: ${data}`);
    });
    thread.on("close", () => {
      console.error("========================================");
      console.error("=========== local-npm 熄火了 ============");
      console.error("========================================");
    });
    setTimeout(() => {
      resolve(thread);
    }, 2000);
  });
}

/**
 * 启动本地npm服务
 */
async function cleanCache() {
  return await spawnWrap(/^win/.test(process.platform) ? "npm.cmd" : "npm", [
    "cache",
    "clean",
    "--force",
  ]);
}

/**
 * 本地进行安装
 * @param {*} ws 本地的安装目录
 */
function localInstall(ws) {
  const projectCwd = path.resolve(ws, "project");

  return new Promise((resolve, reject) => {
    const errors = [];
    // 将范围版本号替换为精准版本号
    try {
      const pkgFile = path.resolve(projectCwd, "package.json");
      let content = fs.readFileSync(pkgFile, "utf-8");
      content = content.replace(/[\^|\~]/g, "");
      fs.writeFileSync(pkgFile, content, "utf-8");
    } catch (error) {
      return reject(error);
    }

    // 开始安装
    const thread = spawn(
      /^win/.test(process.platform) ? "npm.cmd" : "npm",
      ["install", "--force", ...getEnvs('push')],
      {
        cwd: projectCwd
      }
    );

    thread.stderr.on("data", (data) => {
      console.log(`install:stderr: ${data}`);
      // 如果主机停机了，直接退出安装
      if (!checkVerdaccioHealthy(data)) {
        errors.push(data.toString());
        thread.kill("SIGINT");
      } else if (!checkHealthy(data)) {
        errors.push(data.toString());
      }
    });

    thread.stdout.on("data", (data) => {
      console.log(`install:stdout: ${data}`);
    });

    thread.on("close", () => {
      if (errors.length > 0) {
        reject(errors);
      } else {
        resolve();
      }
    });

    thread.on("aborted", (error) => {
      console.log(`系统超时退出了: ${error}`);
    });
  });
}

/**
 * 清理目录
 * @param {*} folder
 */
function clean(folder) {
  return new Promise((resolve, reject) => {
    rimraf(`${folder}/*`, (err) => {
      return err ? reject(err) : resolve();
    });
  });
}

function checkHealthy(message) {
  const keywords = [
    "ERR!", // 可能是下载的对应的包不存在
  ];
  return !keywords.some((keyword) => {
    return message.includes(keyword);
  });
}

function checkVerdaccioHealthy(message) {
  const keywords = [
    "ECONNREFUSED", // 可能是主机关掉了
  ];
  return !keywords.some((keyword) => {
    return message.includes(keyword);
  });
}

/**
 * @returns { ChildProcess }
 * @param  {...any} argv
 */
function spawnWrap(...argv) {
  return new Promise((resolve) => {
    const thread = spawn(...argv);
    const [command, args] = argv;
    const threadName = `${command} ${args ? args.join(" ") : ""}`;
    thread.stdout.on("data", (data) => {
      console.log(`stdout:${threadName}:${data}`);
    });
    thread.stderr.on("error", (error) => {
      console.log(`stderr:${threadName}:${error}`);
    });
    thread.on("close", () => {
      setTimeout(() => {
        resolve(thread);
      }, 3000);
    });
  });
}

module.exports = router;
