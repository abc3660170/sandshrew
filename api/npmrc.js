var axios = require("axios");
var express = require("express");
var { getEnvs } = require('../utils/utils')
var router = express.Router();
/* GET users listing. */
router.get("/", async function(req, res, next) {
    const config = getEnvs().map(item => {
        // 去掉配置项前面的 -- 
        const matcher = /-*(.+)/.exec(item);
        return matcher[1]
    })
    res.json(config)
});

module.exports = router;
