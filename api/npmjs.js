var axios = require("axios");
var express = require("express");
var router = express.Router();
var makeDB = require("../model/makeDB");
var app = express();
var { frontType, isBusy } = require("../utils/utils");
var { INUSED } = require("../utils/errorCode");
var { getSuggestions, getPackageDocument } = require("../model/pelipper");
/* GET users listing. */
router.get("/suggestions", async function(req, res, next) {
  try {
    const keyword = req.query.q;
    let result;
    if (frontType === "npmjs") {
      const response = await axios.get(
        `https://www.npmjs.com/search/suggestions?q=${keyword}`
      );
      result = response.data;
    } else if (frontType === "pelipper") {
      result = await getSuggestions(keyword);
    } else {
      throw new Error("frontType is not in ['npmjs, pelipper']");
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/package/:name/document", async function(req, res, next) {
  try {
    const packageName = req.params.name;
    let result;
    if (frontType === "npmjs") {
      const response = await axios.get(
        `https://registry.npmjs.org/${packageName}`
      );
      result = response.data;
    } else if (frontType === "pelipper") {
      result = await getPackageDocument(packageName);
    } else {
      throw new Error("frontType is not in ['npmjs, pelipper']");
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/download", async function(req, res, next) {
  req.on("aborted", () => {
    // todo 撤销下载
  });
  if (isBusy()) {
    res.status(500).json({
      code: INUSED,
      message: "有人在用你先等等还行啊！",
    });
  } else {
    process.env.NPM_DOWNLOADING = true;
    const packages = req.body;
    try {
      const zipFile = await makeDB(packages);
      res.download(zipFile, () => {
        process.env.NPM_DOWNLOADING = false;
      });
    } catch (error) {
      res.status(500).json({
        code: error.name,
        message: error.message,
      });
      process.env.NPM_DOWNLOADING = false;
    }
  }
});

module.exports = router;
