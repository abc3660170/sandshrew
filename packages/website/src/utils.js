module.exports.getValidVersions = (pkg) => {
    return Object.keys(pkg.versions)
      .reverse()
      .filter((val) => {
        !val.startsWith("_fee_");
      });
  };