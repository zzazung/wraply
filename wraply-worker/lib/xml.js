// wraply-worker/lib/xml.js

const fs = require("fs");
const xml2js = require("xml2js");

const { safeWrite } = require("./file");

async function updateXmlString(file, key, value){

  if (!fs.existsSync(file)) return;

  const xml = fs.readFileSync(file, "utf-8");

  const parsed = await xml2js.parseStringPromise(xml);

  const resources = parsed.resources;

  if (!resources.string){
    resources.string = [];
  }

  let found = false;

  for (const s of resources.string){
    if (s.$?.name === key){
      s._ = value;
      found = true;
      break;
    }
  }

  if (!found){
    resources.string.push({
      _: value,
      $:{ name:key }
    });
  }

  const builder = new xml2js.Builder({
    headless:true
  });

  const newXml = builder.buildObject(parsed);

  safeWrite(file, newXml); // 🔥 중요

}

module.exports = {
  updateXmlString
};