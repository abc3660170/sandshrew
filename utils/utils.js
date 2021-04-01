var yaml = require('js-yaml');
var path = require('path');
var fs = require('fs');
var spawn = require('child_process').spawn;
const { networkInterfaces } = require('os');
const nets = networkInterfaces();
var configFile = path.resolve(__dirname, process.env.SANDSHREW_CONFIG || '../config.yml');
const doc = yaml.load(fs.readFileSync(configFile));

module.exports.frontType = doc['front-type'];

function _getLocalNpmConfig(){
    const from = doc['front-type'];
    const config = doc[from];
    const url = `http://${_getLocalIPv4Address()}:${config.port}`
    return {
        ...config,
        from, // npm 和 pelipper 对获取tarball的方式不同
        url
    }
}

module.exports.getLocalNpmConfig = _getLocalNpmConfig;

function _getAppConfig() {
    return doc['app'];
}

module.exports.getAppConfig = _getAppConfig;

module.exports.pelipperConfig = doc['pelipper']

module.exports.getNPMCommand = () => {
    return /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
}

function _getLocalIPv4Address(){
    const results = [];
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                results.push(net.address);
            }
        }
    }
    return results[0];
}

module.exports.getLocalIPv4Address = _getLocalIPv4Address

module.exports.getEnvs = function(){
    var configFile = path.resolve(__dirname, '../mirror.yml');
    const { url: npmRegistry, mirrorPath } = _getLocalNpmConfig();
    const binaryHosts = yaml.load(fs.readFileSync(configFile));
    const result = [];
    for (const key in binaryHosts) {
        if (Object.hasOwnProperty.call(binaryHosts, key)) {
            const host = `${mirrorPath}/${binaryHosts[key]}`;
            result.push(`--${key}=${host}`); 
        }
    }
    result.push(`--registry=${npmRegistry}`);
    return result;
}

module.exports.isBusy = function(){

    return process.env.NPM_DOWNLOADING !== 'false' || process.env.NPM_UPLOAD !== 'false';
}


module.exports.spawnWrap = (command, args, opts) => {
    return new Promise((resolve, reject) => {
      let errors = '';
      const thread = spawn(command, args, opts);
      const name = `${command} ${args.join(" ")}`;
      thread.stdout.on("data", (data) => {
        console.log(`${name}:${data}`);
      });
      thread.stderr.on("data", (error) => {
        errors = errors + '\n' + error.toString('utf-8');
        // reject(error);
      });
      thread.on("close", () => {
        setTimeout(() => {
          if(errors.length > 0){
            reject(errors);
          } else {
            resolve(thread);
          }
        }, 3000);
      });
    });
  }