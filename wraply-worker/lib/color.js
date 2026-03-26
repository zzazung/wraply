// lib/color.js

const Vibrant = require("node-vibrant");
const path = require("path");

async function extractPrimaryColor(filePath){

  const abs = path.join(process.env.WRAPLY_ROOT, filePath);

  const palette = await Vibrant.from(abs).getPalette();

  const color =
    palette.Vibrant?.hex ||
    palette.Muted?.hex ||
    "#3b82f6";

  return color;

}

module.exports = {
  extractPrimaryColor
};