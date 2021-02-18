var axios = require("axios");
var express = require("express");
var router = express.Router();
var makeDB = require('../model/makeDB');
var app = express();

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
    req.on('aborted', () => {
        // todo 撤销下载
    })
    if(app.locals.downloading){
        res.status(226).end('有人在用你先等等')
    } else {
        app.locals.downloading = true;
        const packages = req.body;
        try {
            const zipFile = await makeDB(packages);
            res.download(zipFile,() => {
                app.locals.downloading = false;
            });
        } catch (error) {
            app.locals.downloading = false;
        }
        
    }

    
});

module.exports = router;