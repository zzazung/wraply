const request = require("supertest")
const express = require("express")

const jobsRouter = require("../../wraply-api/routes/jobs")

const app = express()

app.use(express.json())
app.use("/", jobsRouter)

describe("Jobs API", () => {

  test("GET job", async () => {

    const res = await request(app)
      .get("/jobs/test");

    expect(res.statusCode).toBeLessThan(500);

  });

});