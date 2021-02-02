var path = require('path');
var localNpm = require('fee-local-npm');
var { getLocalNpmConfig } = require('../utils/utils');

const localNpmConfig = getLocalNpmConfig();
const directory = path.resolve(__dirname,"../tmp/data");
const options = Object.assign(localNpmConfig, {directory})
localNpm(options);
