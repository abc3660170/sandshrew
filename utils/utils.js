var yaml = require('js-yaml');
var path = require('path');
var fs = require('fs');
var configFile = path.resolve(__dirname, '../config.yml');
const doc = yaml.load(fs.readFileSync(configFile));

module.exports.getFrontType = () => {
    return doc['front-type'];
}

module.exports.getLocalNpmConfig = () => {
    return doc['local-npm'];
}

module.exports.getVerdaccioConfig = () => {
    return doc['verdaccio'];
}