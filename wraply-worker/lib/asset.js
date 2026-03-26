// lib/asset.js

const fs = require("fs");
const path = require("path");

function readAsset(relPath){

  const abs = path.join(process.env.WRAPLY_ROOT, relPath);

  if (!fs.existsSync(abs)){
    throw new Error(`asset not found: ${relPath}`);
  }

  return fs.readFileSync(abs);

}

module.exports = {
  readAsset
};