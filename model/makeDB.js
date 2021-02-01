var path = require('path');
var shelljs = require('shelljs');
var fs = require('fs');
var express = require('express');
const { spawn } = require('child_process');
var app = express();

/**
 * 生成包数据库（pouchDB）
 * @param {*} packageArr ['express@4.1.7', ...]
 */
module.exports = async function(packageArr){
    if(!(packageArr instanceof Array) || packageArr.length === 0){
        throw new Error('不是数组，或者这是个空数组！');
    }

    const lastLocalNpm = app.locals.localNpm;
    if(lastLocalNpm){
        lastLocalNpm.kill();
    }

    const workspace = path.resolve(__dirname, "../tmp");
    shelljs.rm('-rf', workspace);
    shelljs.mkdir(workspace);

    shelljs.cd(workspace);
    const localNpm = app.locals.localNpm = spawn('node',['local-npm.js'], {
        cwd: path.resolve(__dirname, '../build')
    });
    localNpm.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });
    localNpm.stderr.on('error', (data) => {
        console.log(`stdout: ${data}`);
    });

    shelljs.cd(workspace);
    shelljs.rm('-rf', "*");
    shelljs.mkdir('project');
    shelljs.cd('project');
    shelljs.exec("npm init -y");
    const str = packageArr.join(" ");
    shelljs.exec(`npm install ${str} --force --registry=http://localhost:5080/`);
    localNpm.kill();
}
