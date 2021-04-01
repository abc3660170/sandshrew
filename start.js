var spawn = require('child_process').spawn;
var { getNPMCommand, spawnWrap } = require('./utils/utils');
const argv = process.argv;
if(argv['2'] !== '--conf' || !argv['3']){
    throw new Error('没有传入配置文件！！');
}
const config = argv['3'];
var buildThread = spawnWrap(getNPMCommand(), ['run', 'build'], {
    cwd: __dirname,
    env:Object.assign({}, process.env, {
        SANDSHREW_CONFIG: config
    })
});

buildThread.then(() => {
    startServeThread()
}).catch(startServeThread)

function startServeThread(){
    return spawnWrap(getNPMCommand(), ['run', 'start:service'], {
        cwd: __dirname,
        env:Object.assign({}, process.env, {
            SANDSHREW_CONFIG: config
        })
    });
}
