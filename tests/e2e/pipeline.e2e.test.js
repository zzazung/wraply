const request = require("supertest")
const express = require("express")

const projectsRouter = require("../../wraply-api/routes/user.projects")
const jobsRouter = require("../../wraply-api/routes/jobs")

const pool = require("../../wraply-api/db")

const app = express()

app.use(express.json())

// 🔹 테스트용 인증 bypass
app.use((req, res, next) => {
  req.user = {
    id: "test_user",
    email: "test@test.com"
  }
  next()
})

app.use("/user", projectsRouter)
app.use("/jobs", jobsRouter)

describe("Full Pipeline", () => {

  test("build pipeline", async () => {

    const projectId = "test_project_" + Date.now()

    await pool.query(`
      INSERT INTO projects (
        id,
        name,
        safe_name,
        package_name,
        service_url
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      projectId,
      "TestApp",
      "testapp",
      "com.test.app",
      "https://example.com"
    ])

    const buildRes = await request(app)
      .post(`/user/projects/${projectId}/builds`)
      .send({ platform: "android" })

    expect(buildRes.statusCode).toBe(200)

    const [rows] = await pool.query(`
      SELECT * FROM jobs
      WHERE project_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `, [projectId])

    expect(rows.length).toBeGreaterThan(0)

    const jobId = rows[0].job_id

    const jobRes = await request(app)
      .get(`/jobs/${jobId}`)

    expect(jobRes.statusCode).toBe(200)

  })

})