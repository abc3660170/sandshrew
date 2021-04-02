var axios = require("axios");
var express = require("express");
var { getEnvs } = require('../utils/utils')
var router = express.Router();
/* GET users listing. */
router.get("/", async function(req, res, next) {
    res.json(getEnvs())
    getEnvs()
});

module.exports = router;
