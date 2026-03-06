const retryFailedJobs = require("../../wraply-scheduler/jobs/retryFailedJobs");

describe("Scheduler Jobs", () => {

  test("retryFailedJobs should execute", async () => {

    await retryFailedJobs();

    expect(true).toBe(true);

  });

});