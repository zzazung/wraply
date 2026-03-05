jest.mock("../../wraply-api/db", () => ({

  query: jest.fn().mockResolvedValue([])

}))

const { runBuild } = require("../../wraply-worker/queue/buildWorker")

describe("Build Worker", () => {

  test("runBuild should not crash", async () => {

    const job = {
      jobId: "job_test",
      platform: "android",
      safeName: "test",
      packageName: "com.test.app",
      appName: "TestApp",
      serviceUrl: "https://example.com"
    }

    await expect(runBuild(job)).resolves.not.toThrow()

  })

})