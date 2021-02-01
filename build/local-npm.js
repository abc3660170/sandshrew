var fs = require('fs');
var path = require('path');
var localNpm = require('fee-local-npm');
var yaml = require('js-yaml');

var configFile = path.resolve(__dirname, '../config.yml');
const doc = yaml.load(fs.readFileSync(configFile));
const directory = path.resolve(__dirname,"../tmp/data");
const options = Object.assign(doc['local-npm'],directory)
localNpm(options);
