const request = require("supertest")
const express = require("express")

const projectsRouter = require("../../wraply-api/routes/user.projects")
const jobsRouter = require("../../wraply-api/routes/jobs")

const pool = require("../../wraply-api/db")

const app = express()

app.use(express.json())
app.use("/user", projectsRouter)
app.use("/jobs", jobsRouter)

describe("Full Pipeline", () => {

  test("build pipeline", async () => {

    const projectId = "test_project_" + Date.now()

    // 테스트용 프로젝트 생성
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

    // build 요청
    const buildRes = await request(app)
      .post(`/user/projects/${projectId}/builds`)
      .send({
        platform: "android"
      })
    console.log("Build Response:", buildRes.body)

    const jobId =
      buildRes.body.jobId ||
      buildRes.body.job_id ||
      buildRes.body.job?.job_id

    expect(jobId).toBeDefined()

    // job 조회
    const jobRes = await request(app)
      .get(`/jobs/${jobId}`)

    expect(jobRes.statusCode).toBe(200)

    await pool.query(
      "DELETE FROM projects WHERE id=?",
      [projectId]
    )
  })

})