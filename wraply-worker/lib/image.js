// wraply-worker/lib/image.js

const axios = require("axios");
const fs = require("fs");
const sharp = require("sharp");

async function downloadImage(url){

  const res = await axios({
    url,
    responseType: "arraybuffer"
  });

  return Buffer.from(res.data, "binary");

}

async function resizeAndSave(buffer, size, dest){

  await sharp(buffer)
    .resize(size, size)
    .png()
    .toFile(dest);

}

module.exports = {
  downloadImage,
  resizeAndSave
};