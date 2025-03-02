const { pelipperConfig, frontType } = require("../utils/utils");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { storage } = pelipperConfig;

async function getSuggestions(q) {
  const nsMatcher = /(^.+)\//.exec(q);
  const pkgMatcher = /[^\/]+$/.exec(q);
  const ns = nsMatcher ? nsMatcher[1] : "";
  const pkg = pkgMatcher ? pkgMatcher[0] : "";

  if (frontType === "npmjs") {
    const response = await axios.get(`https://www.npmjs.com/search/suggestions?q=${q}`);
    return response.data;
  } else if (frontType === "pelipper") {
    if (!storage) {
      throw new Error("pelipper's storage configuration is empty!");
    }

    const nsDir = path.resolve(storage, ns);
    return new Promise((resolve, reject) => {
      fs.readdir(nsDir, "utf-8", (error, files) => {
        if (error) {
          return reject(error);
        }

        const suggestions = files
          .filter(file => pkg.trim() !== "" && file.startsWith(pkg) && !file.startsWith("@"))
          .map(file => ({ name: path.join(ns, file) }));

        resolve(suggestions);
      });
    });
  } else {
    throw new Error("frontType is not in ['npmjs', 'pelipper']");
  }
}

async function getPackageDocument(packageName) {
  if (frontType === "npmjs") {
    const response = await axios.get(`https://registry.npmjs.org/${packageName}`);
    return response.data;
  } else if (frontType === "pelipper") {
    const pkgPath = path.resolve(storage, packageName, "package.json");
    return new Promise((resolve, reject) => {
      fs.readFile(pkgPath, "utf-8", (error, data) => {
        if (error) {
          return reject(error);
        }
        resolve(JSON.parse(data));
      });
    });
  } else {
    throw new Error("frontType is not in ['npmjs', 'pelipper']");
  }
}

module.exports = { getSuggestions, getPackageDocument };
