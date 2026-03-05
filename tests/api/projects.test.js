const request = require("supertest");
const express = require("express");

const jobsRouter = require("../../wraply-api/routes/jobs");

const app = express();

app.use(express.json());
app.use("/jobs", jobsRouter);

describe("Jobs API", () => {

  test("GET /jobs/:jobId should return job", async () => {

    const res = await request(app)
      .get("/jobs/job_test");

    expect(res.statusCode).toBe(200);

  });

});