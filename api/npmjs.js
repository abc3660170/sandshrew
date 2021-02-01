var axios = require("axios");
var express = require("express");
var router = express.Router();
var makeDB = require('../model/makeDB');
/* GET users listing. */
router.get('/suggestions', async function(req, res, next) {
    try {
        const keyword = req.query.q;
        const response = await axios.get(`https://www.npmjs.com/search/suggestions?q=${keyword}`);
        res.json(response.data);
    } catch (error) {
        next(error)
    }  
});

router.get('/package/:name/document', async function(req, res, next) {
    try {
        const packageName  = req.params.name;
        const response = await axios.get(`https://registry.npmjs.org/${packageName}`);
        res.json(response.data);
    } catch (error) {
        next(error)
    }  
});

router.post('/download', async function(req, res, next) {
     const packages = req.body;
     makeDB(packages)
     res.end()
});

module.exports = router;