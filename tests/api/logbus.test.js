const request = require("supertest");

const app = require("../../wraply-api/app");

const { createTestToken } = require("../helpers/auth");

describe("Log API", () => {

  const token = createTestToken();

  test("GET /jobs/:jobId/log", async () => {

    const res = await request(app)
      .get("/jobs/test-job-1/log")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBeLessThan(500);

  });

});