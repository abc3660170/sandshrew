var fs = require('fs');
var path = require('path');
var localNpm = require('local-npm');
var yaml = require('js-yaml');

var configFile = path.resolve(__dirname, '../config.yml');
const doc = yaml.load(fs.readFileSync(configFile));



module.exports = () => {
    return localNpm(doc['local-npm']);
}
