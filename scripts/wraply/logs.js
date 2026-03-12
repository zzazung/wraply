const service = process.argv[3]

if (!service) {

  console.log("wraply logs <service>")
  process.exit()

}

console.log(`Streaming logs for ${service}`)

require("./dev")