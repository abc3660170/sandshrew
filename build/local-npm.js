var path = require("path");
var localNpm = require("fee-local-npm");
var localNpmPush = require("fee-local-npm-intranet");
var { getLocalNpmConfig } = require("../utils/utils");
const localNpmConfig = getLocalNpmConfig();
const directory = path.resolve(__dirname, "../tmp/data");
const defaultOptions = {
  directory,
  remoteSkim: "https://replicate.npmjs.com",
};
const options = Object.assign(localNpmConfig, defaultOptions);
console.log(process.env.NPM_TYPE);
if (process.env.NPM_TYPE === "push") {
  localNpmPush(options);
} else if (process.env.NPM_TYPE === "pull") {
  localNpm(options);
}
