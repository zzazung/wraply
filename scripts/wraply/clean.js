const { execSync } = require("child_process")

console.log("Cleaning repo")

execSync("rm -rf node_modules", { stdio: "inherit" })
execSync("rm -rf **/node_modules", { stdio: "inherit" })
execSync("rm -rf .next dist", { stdio: "inherit" })

console.log("Done")