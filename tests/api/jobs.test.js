const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../../wraply-api/app");

const db = require("@wraply/shared/db");

describe("Jobs API", () => {

  const token = jwt.sign(
    { userId: 1 },
    process.env.JWT_SECRET
  );

  const jobId = "test-job-1";

  beforeAll(async () => {
    await db.query(
      "DELETE FROM jobs WHERE job_id=?",
      ["test-job-1"]
    );

    await db.query(
      "INSERT INTO jobs (job_id, status) VALUES (?, ?);",
      [jobId, "queued"]
    );

  });

  afterAll(async () => {

    await db.query(
      "DELETE FROM jobs WHERE job_id=?;",
      [jobId]
    );

    if (db.pool) {
      await db.pool.end();
    }
  });

  test("GET /jobs/:jobId", async () => {

    const res = await request(app)
      .get(`/jobs/${jobId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);

  });

});