var yaml = require('js-yaml');
var path = require('path');
var fs = require('fs');
const { networkInterfaces } = require('os');
const nets = networkInterfaces();

var configFile = path.resolve(__dirname, '../config.yml');
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
    const { remote: npmRegistry, mirror } = _getLocalNpmConfig();
    const binaryHosts = yaml.load(fs.readFileSync(configFile));
    const result = [];
    for (const key in binaryHosts) {
        if (Object.hasOwnProperty.call(binaryHosts, key)) {
            const host = `${mirror}/${binaryHosts[key]}`;
            result.push(`--${key}=${host}`); 
        }
    }
    result.push(`--registry=${npmRegistry}`);
    return result;
}