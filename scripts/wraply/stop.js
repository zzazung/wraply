const { execSync } = require("child_process")

console.log("Stopping services")

try {

  execSync("pkill -f wraply-api")
  execSync("pkill -f wraply-worker")
  execSync("pkill -f wraply-scheduler")
  execSync("pkill -f wraply-admin")
  execSync("pkill -f wraply-user")

} catch {}

console.log("Stopped")