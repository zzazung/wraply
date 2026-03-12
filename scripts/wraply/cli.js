#!/usr/bin/env node

const cmd = process.argv[2]

switch (cmd) {

  case "dev":
    require("./dev")
    break

  case "doctor":
    require("./doctor")
    break

  case "build":
    require("./build")
    break

  case "stop":
    require("./stop")
    break

  case "clean":
    require("./clean")
    break

  case "logs":
    require("./logs")
    break

  case "restart":
    require("./restart")
    break

  default:

    console.log(`
Wraply CLI

Commands

wraply dev
wraply doctor
wraply build
wraply stop
wraply clean
wraply logs <service>
wraply restart <service>
`)
}