var path = require("path");
var express = require("express");
const { spawn } = require("child_process");
var app = express();
var { getLocalNpmConfig } = require("../utils/utils");
var mkdirp = require("mkdirp");
const rimraf = require("rimraf");

/**
 * 生成包数据库（pouchDB）
 * @param {*} packageArr ['express@4.1.7', ...]
 */
module.exports = async function(packageArr) {
  if (!(packageArr instanceof Array) || packageArr.length === 0) {
    throw new Error("不是数组，或者这是个空数组！");
  }

  try {
    // 确保上一次的npm收集器已关闭
    const lastLocalNpm = app.locals.localNpm;
    if (lastLocalNpm) {
      lastLocalNpm.kill();
    }

    // 初始化临时文件夹
    const workspace = path.resolve(__dirname, "../tmp");
    await rmRf(workspace);
    await mkdirp(workspace);
    // 启动local-npm收集服务器
    const localNpm = await startLocalNpm();
    // 创建临时项目开始抓取包
    await pull(workspace, packageArr);
    localNpm.kill();
  } catch (error) {
    console.error(error);
    throw error;
  }

  return await downloadZipFile(workspace);
};

// 生成必要的zip包
async function downloadZipFile(cwd, receiveUser = "陈涛") {
  const date = new Date().toISOString();
  const legalDateStr = date.replace(/[^0-9]*/g, "");
  const file = path.resolve(cwd, `to内网${receiveUser}${legalDateStr}.zip`);
  await spawnWrap("zip", ["-r", file, "data", "project/package.json"], { cwd });
  return file;
  //return path.resolve(cwd, `to内网陈涛20210202015013466.zip`)
}

function startLocalNpm() {
  return new Promise(resolve => {
    const thread = spawn("node", ["local-npm.js"], {
      cwd: path.resolve(__dirname, "../build"),
    });
    const name = `node local-npm.js`;
    thread.stdout.on("data", (data) => {
      console.log(`${name}:${data}`);
    });
    thread.stderr.on("error", (error) => {
      console.error(`${name}:${error}`);
    });
    setTimeout(() => {
      resolve(thread);
    }, 3000);
  });
}

async function pull(cwd, packageArr) {
  // 创建临时项目文件夹准备开工
  const tmpProject = path.resolve(cwd, "project");
  mkdirp(tmpProject);

  await initProjectConfig(tmpProject);

  await cleanCache();
  await npmInstall(tmpProject, packageArr);
}

// 格式化目录配置
async function initProjectConfig(cwd) {
  return await spawnWrap("npm", ["init", "-y"], { cwd });
}

// 清理npm缓存目录
async function cleanCache() {
  return await spawnWrap("npm", ["cache", "clean", "--force"]);
}

// 开始安装npm依赖
async function npmInstall(cwd, packageArr) {
  const str = packageArr.join(" ");
  const { url } = getLocalNpmConfig();
  return await spawnWrap(
    "npm",
    ["install", str, "--force", `--registry=${url}`],
    { cwd }
  );
}

function spawnWrap(command, args, opts) {
  return new Promise((resolve, reject) => {
    const thread = spawn(command, args, opts);
    const name = `${command} ${args.join(" ")}`;
    thread.stdout.on("data", (data) => {
      console.log(`${name}:${data}`);
    });
    thread.stderr.on("error", (error) => {
      console.error(`${name}:${error}`);
      reject(error);
    });
    thread.on("close", () => {
      setTimeout(() => {
        resolve(thread);
      }, 3000);
    });
  });
}

async function rmRf(file) {
  return new Promise((resolve, reject) => {
    rimraf(file, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
