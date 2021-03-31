var { getVerdaccioConfig } = require("../utils/utils");
var path = require("path");
var fs = require("fs");
const { storage } = getVerdaccioConfig();
function getSuggestions(q) {
  const nsMatcher = /(^.+)\//.exec(q);
  const pkgMatcher = /[^\/]+$/.exec(q);
  const ns = nsMatcher ? nsMatcher[1] : "";
  const pkg = pkgMatcher ? pkgMatcher[0] : "";
  console.log(q);
  return new Promise((resolve, reject) => {
    if (!storage) {
      return reject(new Error("verdaccio's  storage configration is empty!"));
    }
    const nsDir = path.resolve(storage, ns);
    fs.readdir(`${nsDir}`, "utf-8", (error, files) => {
      if (error) {
        return reject(error);
      }
      resolve(
        files
          .filter((file) => {
            return (
              // @一般都不是包名而是ns名，包不能为空担心返回太多结果
              pkg.trim() !== "" && file.startsWith(pkg) && !file.startsWith("@")
            );
          })
          .map((file) => {
            return {
              name: path.join(ns, file),
            };
          })
      );
    });
  });
}

function getPackageDocument(package) {
  const pkg = path.resolve(storage, package, "package.json");
  return new Promise((resolve, reject) => {
    fs.readFile(pkg, "utf-8", (error, data) => {
      if (error) {
        return reject(error);
      }
      resolve(JSON.parse(data));
    });
  });
}

module.exports = { getSuggestions, getPackageDocument };
