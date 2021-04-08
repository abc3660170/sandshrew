var { getPackageDocument } = require("./pelipper");
var { getValidVersions } = require('../utils/utils');
var semver = require('semver');
module.exports.extractVersion = async function(name, semverVersion) {
    const pkg = await getPackageDocument(name);
    const versions = getValidVersions(pkg);
    return semver.maxSatisfying(versions, semverVersion)
}