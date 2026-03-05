const request = require("supertest")
const express = require("express")

const projectsRouter = require("../../wraply-api/routes/user.projects")

const app = express()

app.use(express.json())
app.use("/user", projectsRouter)

describe("Projects API", () => {

  test("list projects", async () => {

    const res = await request(app)
      .get("/user/projects")

    expect(res.statusCode).toBeLessThan(500)

  })

})