const { execSync } = require("child_process")

console.log("Building wraply")

execSync("pnpm -r build", { stdio: "inherit" })