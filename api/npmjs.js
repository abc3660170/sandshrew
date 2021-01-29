var axios = require("axios");
var express = require("express");
// module.exports.suggestions = (keyword) => {
//     return axios.get(`https://www.npmjs.com/search/suggestions?q=${keyword}`);
// }

// module.exports.getPackageDoc = (packageName) => {
//     return axios.get(`https://registry.npmjs.org/${packageName}`);
// }

var router = express.Router()

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

module.exports = router;