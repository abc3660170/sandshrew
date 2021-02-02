var yaml = require('js-yaml');
var path = require('path');
var fs = require('fs');
var configFile = path.resolve(__dirname, '../config.yml');
const doc = yaml.load(fs.readFileSync(configFile));

module.exports.getLocalNpmConfig = () => {
    const doc = yaml.load(fs.readFileSync(configFile));
    return doc['local-npm'];
}