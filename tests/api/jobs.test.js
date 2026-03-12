const request = require("supertest");
const app = require("../../wraply-api/app");
const { query } = require("@wraply/shared/db");

describe("Jobs API", () => {

  const jobId = "test-job-1";

  beforeAll(async () => {

    await query(`
      INSERT INTO jobs (
        job_id,
        platform,
        package_name,
        safe_name,
        app_name,
        status,
        progress,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      jobId,
      "android",
      "com.test.app",
      "test",
      "Test App",
      "finished",
      100
    ]);

  });

  test("GET /jobs/:jobId", async () => {

    const token = "dev-user";

    const res = await request(app)
      .get(`/jobs/${jobId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);

    expect(res.body.job_id).toBe(jobId);
    expect(res.body.status).toBe("finished");
    expect(res.body.progress).toBe(100);

  });

});