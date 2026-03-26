// wraply-worker/lib/file.js

const fs = require("fs");

function safeWrite(file, newContent){

  const backup = file + ".bak";

  if (fs.existsSync(file)){
    fs.copyFileSync(file, backup);
  }

  try{
    fs.writeFileSync(file, newContent);
  }catch(err){

    if (fs.existsSync(backup)){
      fs.copyFileSync(backup, file);
    }

    throw err;
  }

}

module.exports = {
  safeWrite
};