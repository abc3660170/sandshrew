import { FastifyInstance } from "fastify";
import path, { resolve } from "path";
import { spawn } from "child_process";
import { getNPMCommand, getEnvs, spawnWrap, getLocalNpmConfig } from "../utils/utils.ts";

import MyError from "../utils/MyError.ts";
import errorCode from "../utils/errorCode.ts";
import fs, { readFileSync } from "fs";
import { rimraf } from "rimraf";
const npm = getNPMCommand();
const projectRoot = process.cwd();

/**
 * 生成包数据库（pouchDB）
 * @param {*} packageArr ['express@4.1.7', ...]
 */
export default async (fastify: FastifyInstance, packageArr: string[]) => {
  fastify.log.info(`下载包：${packageArr}`)
  if (!(packageArr instanceof Array) || packageArr.length === 0) {
    throw new MyError("不是数组，或者这是个空数组！");
  }

  try {
    // 确保上一次的npm收集器已关闭
    const lastLocalNpm = fastify.globalState.localNpm;
    if (lastLocalNpm) {
      lastLocalNpm.kill();
    }
    
    // 初始化临时文件夹
    const workspace = fastify.REGISTER_CONFIG.tmp;
    await rimraf(workspace);
    fs.mkdirSync(workspace, { recursive: true})
    // 启动local-npm收集服务器
    const localNpm = startLocalNpm(fastify, workspace);
    
    // 创建临时项目开始抓取包
    await pull(fastify, workspace, packageArr);
    localNpm.kill();
    return await downloadZipFile(workspace); 
  } catch (error) {
    fastify.log.error(error)
    throw error;
  }
   
};

// 生成必要的zip包
async function downloadZipFile(cwd: string, receiveUser = "陈涛") {
  const date = new Date().toISOString();
  const legalDateStr = date.replace(/[^0-9]*/g, "");
  const file = path.resolve(cwd, `to内网${receiveUser}${legalDateStr}.zip`);
  console.log('=================== 下载的文件为： ===================')
  console.log(file)
  await spawnWrap("zip", ["-r", file, "data", "project/package.json"], { 
    cwd,
    stdio: ['ignore', 'ignore', 'pipe']
  });
  return file;
  //return path.resolve(cwd, `to内网陈涛20210202015013466.zip`)
}

function startLocalNpm(fastify: FastifyInstance, cwd: string ) {
  const thread = spawn("node", ["local-npm.js"], {
    cwd: resolve(projectRoot, "src/spawn"),
    env: Object.assign({}, process.env, {
      NPM_TYPE: 'pull',
      CONFIG: JSON.stringify(getLocalNpmConfig(fastify)),
      CWD: cwd
    })
  });
  fastify.globalState.localNpm = thread;
  const name = `node local-npm.js`;
  thread.stdout.on("data", (data) => {
    console.log(`${name}:${data}`);
  });
  thread.stderr.on("data", (error) => {
    console.error(`${name}:${error}`);
  });
  return thread
  // return new Promise<ChildProcessWithoutNullStreams>(resolve => setTimeout(() => resolve(thread), 3000));
}

async function pull(fastify: FastifyInstance,cwd: string, packageArr: string[]) {
  // 创建临时项目文件夹准备开工
  const tmpProject = path.resolve(cwd, "project");
  fs.mkdirSync(tmpProject, { recursive: true })
  await initProjectConfig(tmpProject);
  try {
    await cleanCache();
  } catch (error) {}
  await npmInstall(fastify, tmpProject, packageArr);
}

// 格式化目录配置
async function initProjectConfig(cwd: string) {
  return await spawnWrap(npm, ["init", "-y"], {
    stdio: ['ignore', 'ignore', 'pipe']
    ,cwd
  });
}

// 清理npm缓存目录
async function cleanCache() {
  return await spawnWrap(npm, ["cache", "clean", "--force"]);
}

// 开始安装npm依赖
async function npmInstall(fastify: FastifyInstance, cwd: string, packageArr: string[]) {
  const pkg = path.resolve(cwd, 'package.json');
  let thread;
  try {
    const args = ["install", "--unsafe-perm", ...packageArr, ...getEnvs(fastify, 'pull')];
    fastify.log.info(`---------------npm install的全部参数：---------------`)
    fastify.log.info(args)
    thread = await spawnWrap(
      npm,
      args,
      { 
        cwd,
        stdio: ['ignore', 'ignore', 'pipe']
      }
    );
  } catch (error) {
    if(error.indexOf('ENOTFOUND') !== -1){
      fastify.log.error('npm registry 服务器没开机？');
    } else if(error.indexOf('ERR!') === -1) {
      fastify.log.warn('有一些警告，不必过于紧张\n');
      fastify.log.warn(error);
    } else {
      // 输出的内容里面有ERR:
      throw new Error(error);
    }
  }
  
  const content = JSON.parse(readFileSync(pkg,'utf-8'));
  if(!content['dependencies']){
    throw new MyError('可能是因为安装的包太多了导致的', errorCode.MEMLOW);
  }
  return thread;
}

// async function rmRf(file) {
//   return new Promise((resolve, reject) => {
//     , (error) => {
//       if (error) {
//         reject(error);
//       } else {
//         resolve();
//       }
//     });
//   });
// }
