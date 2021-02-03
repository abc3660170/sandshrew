var path = require('path');
var shelljs = require('shelljs');
var fs = require('fs');
var express = require('express');
const { spawn } = require('child_process');
var app = express();
var { getLocalNpmConfig } = require('../utils/utils');


/**
 * 生成包数据库（pouchDB）
 * @param {*} packageArr ['express@4.1.7', ...]
 */
module.exports = async function(packageArr){
    if(!(packageArr instanceof Array) || packageArr.length === 0){
        throw new Error('不是数组，或者这是个空数组！');
    }

    // 启动local-npm收集服务器
    const lastLocalNpm = app.locals.localNpm;
    if(lastLocalNpm){
        lastLocalNpm.kill();
    }
    const workspace = path.resolve(__dirname, "../tmp");
    shelljs.rm('-rf', `${workspace}/*`);
    //shelljs.mkdir(workspace);

    
    const localNpm = await startLocalNpm();

    
    // 创建临时项目开始抓取包
    //shelljs.cd(workspace);
    shelljs.mkdir('project');
    shelljs.cd('project');
    shelljs.exec("npm init -y");
    const str = packageArr.join(" ");
    const { url } = getLocalNpmConfig()
    shelljs.exec(`npm cache clean --force`);
    shelljs.exec(`npm install ${str} --force --registry=${url}`);
    localNpm.kill();

    // 生成必要的zip包
    const zipFile = downloadZipFile(workspace)
    shelljs.cd(workspace);
    shelljs.exec(`zip -r ${zipFile} data project/package.json`);

    // 下载zip包
    return zipFile;
}

function downloadZipFile(cwd){
    const date = new Date().toISOString()
    const legalDateStr = date.replace(/[^0-9]*/g,"");
    return path.resolve(cwd, `to内网陈涛${legalDateStr}.zip`)
    //return path.resolve(cwd, `to内网陈涛20210202015013466.zip`)
    
}

async function startLocalNpm(){
    return new Promise(resolve => {
        const localNpm = app.locals.localNpm = spawn('node',['local-npm.js'], {
            cwd: path.resolve(__dirname, '../build')
        });
        localNpm.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });
        localNpm.stderr.on('error', (data) => {
            console.log(`stdout: ${data}`);
        });
        setTimeout(() => {
            resolve(localNpm)
        },3000)
    })
    
}
