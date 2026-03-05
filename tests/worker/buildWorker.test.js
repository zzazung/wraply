const { runBuild } = require("../../wraply-worker/queue/buildWorker");

describe("Worker Build", () => {

  test("runBuild should execute without crash", async () => {

    const job = {
      jobId: "job_test",
      platform: "android",
      safeName: "testapp",
      packageName: "com.test.app",
      appName: "TestApp",
      serviceUrl: "https://example.com"
    };

    await expect(runBuild(job)).resolves.not.toThrow();

  });

});