const { enqueueBuild } = require("../../wraply-api/queue/buildQueue")

describe("Build Queue", () => {

  test("enqueue build job", async () => {

    const job = await enqueueBuild({
      jobId: "test_job_" + Date.now(),
      projectId: "project_test",
      platform: "android"
    })

    expect(job).toBeDefined()

  })

})