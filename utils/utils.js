var yaml = require('js-yaml');
var path = require('path');
var fs = require('fs');
var configFile = path.resolve(__dirname, '../config.yml');
const doc = yaml.load(fs.readFileSync(configFile));

module.exports.frontType = doc['front-type'];

module.exports.getLocalNpmConfig = () => {
    return doc[doc['front-type']];
}

module.exports.pelipperConfig = doc['pelipper']

module.exports.getNPMCommand = () => {
    return /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
}