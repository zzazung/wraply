const request = require("supertest")
const express = require("express")

const jobsRouter = require("../../wraply-api/routes/jobs")

const app = express()

app.use(express.json())
app.use("/", jobsRouter)

describe("Build E2E", () => {

  test("create build job", async () => {

    const res = await request(app)
      .post("/jobs/build")
      .send({
        platform: "android"
      })

    expect(res.statusCode).toBeLessThan(500)

  })

})