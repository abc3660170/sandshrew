import path from "path";
import localNpm from "fee-local-npm";
// import localNpmPush from "fee-local-npm-intranet";
const directory = path.resolve(process.env.CWD, "./data");
const defaultOptions = {
  directory,
  logLevel: 'debug',
  remoteSkim: "https://replicate.npmjs.com",
};

const options = Object.assign(JSON.parse(process.env.SANDSHREW_CONFIG), defaultOptions);
console.log(`================== 调用fee-local-npm${process.env.NPM_TYPE === 'pull' ? '' : '-intranet'}的参数 ==================`)
console.log(options)
if (process.env.NPM_TYPE === "push") {
  //console.log("完善内网fee-local-npm-intranet的重构");
  //localNpmPush(options);
  //todo 完善内网fee-local-npm-intranet的重构
  localNpm({...options, method: 'push'}).then(({ start }) => {
    start();
  });
} else if (process.env.NPM_TYPE === "pull") {
  localNpm({...options, method: 'pull'}).then(({ start }) => {
    start();
  });
}