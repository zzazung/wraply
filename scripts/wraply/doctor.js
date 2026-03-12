const { execSync } = require("child_process")

function check(cmd) {

  try {

    execSync(`${cmd} --version`, { stdio: "ignore" })

    console.log(`✅ ${cmd}`)

  } catch {

    console.log(`❌ ${cmd} missing`)
    process.exit(1)

  }

}

console.log("\nChecking environment\n")

check("node")
check("pnpm")
check("git")

console.log("\nEnvironment OK\n")