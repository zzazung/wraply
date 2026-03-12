const { spawn } = require("child_process")

const services = {

  api: ["pnpm", ["--filter", "wraply-api", "dev"]],
  worker: ["pnpm", ["--filter", "wraply-worker", "dev"]],
  scheduler: ["pnpm", ["--filter", "wraply-scheduler", "dev"]],
  admin: ["pnpm", ["--filter", "wraply-admin", "dev"]],
  user: ["pnpm", ["--filter", "wraply-user", "dev"]]

}

const colors = {

  api: "\x1b[36m",
  worker: "\x1b[32m",
  scheduler: "\x1b[33m",
  admin: "\x1b[35m",
  user: "\x1b[34m"

}

const processes = []

console.log("\n🚀 Wraply Dev Environment\n")

Object.entries(services).forEach(([name, config]) => {

  const [cmd, args] = config

  const proc = spawn(cmd, args, { shell: true })

  processes.push(proc)

  proc.stdout.on("data", data => {

    process.stdout.write(
      `${colors[name]}[${name}]\x1b[0m ${data}`
    )

  })

  proc.stderr.on("data", data => {

    process.stderr.write(
      `${colors[name]}[${name}]\x1b[0m ${data}`
    )

  })

})

process.on("SIGINT", () => {

  console.log("\nStopping services")

  processes.forEach(p => p.kill())

  process.exit()

})