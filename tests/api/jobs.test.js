const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../../wraply-api/server");

const db = require("@wraply/shared/db");

describe("Jobs API", () => {

  const token = jwt.sign(
    { userId: 1, role: "admin" },
    process.env.JWT_SECRET
  );

  const jobId = "test-job-1";

  beforeAll(async () => {

    await db.query(
      "INSERT INTO jobs (id, status) VALUES (?, ?);",
      [jobId, "queued"]
    );

  });

  afterAll(async () => {

    await db.query(
      "DELETE FROM jobs WHERE id=?;",
      [jobId]
    );

  });

  test("GET /jobs/:jobId", async () => {

    const res = await request(app)
      .get(`/jobs/${jobId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.jobId).toBe(jobId);

  });

});