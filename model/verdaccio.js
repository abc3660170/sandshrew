var { getVerdaccioConfig } = require("../utils/utils")
var path = require('path');
var fs = require('fs');
const { storage } = getVerdaccioConfig();
function getSuggestions(q) {
    return new Promise((resolve, reject) => {
        if(!storage){
            return reject(new Error('verdaccio\'s  storage configration is empty!'));
        }
        fs.readdir(storage, 'utf-8', (error, files) => {
            if(error){
                return reject(error);
            }
            resolve(files.filter((file) => {
                return file.startsWith(q);
            }).map(file => {
                return {
                    name: path.basename(file)
                }
            }))
        })
    })
    
}

function getPackageDocument(package) {
    const pkg = path.resolve(storage, package, 'package.json');
    return new Promise((resolve, reject) => {
        fs.readFile(pkg, 'utf-8', (error, data) => {
            if(error){
                return reject(error);
            }
            resolve(JSON.parse(data))
        })
    })
}

module.exports = { getSuggestions, getPackageDocument }