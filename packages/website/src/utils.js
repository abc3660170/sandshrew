module.exports.getValidVersions = (pkg) => {
    return Object.keys(pkg.versions)
      .reverse()
      .filter((val) => {
        return !val.startsWith("_fee_");
      });
  };