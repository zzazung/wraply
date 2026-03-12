jest.mock("@wraply/shared/queue", () => ({
  enqueueBuild: jest.fn()
}));

const { retryFailedJobs } =
  require("../../wraply-scheduler/jobs/retryFailedJobs");

const { query } =
  require("@wraply/shared/db");

const { enqueueBuild } =
  require("@wraply/shared/queue");

describe("Scheduler retry", () => {

  const JOB1 = "retry-job-1";
  const JOB2 = "retry-job-2";

  beforeEach(async () => {

    /**
     * 테스트 데이터 초기화
     */
    await query(`
      DELETE FROM jobs
      WHERE job_id IN (?, ?)
    `, [JOB1, JOB2]);

    /**
     * retry 가능한 job
     */
    await query(`
      INSERT INTO jobs (
        job_id,
        project_id,
        status,
        retry_count,
        max_retry,
        created_at,
        updated_at
      )
      VALUES (?, 1, 'failed', 0, 3, NOW(), NOW())
    `, [JOB1]);

    /**
     * retry 초과 job
     */
    await query(`
      INSERT INTO jobs (
        job_id,
        project_id,
        status,
        retry_count,
        max_retry,
        created_at,
        updated_at
      )
      VALUES (?, 1, 'failed', 3, 3, NOW(), NOW())
    `, [JOB2]);

    enqueueBuild.mockClear();

  });

  afterAll(async () => {

    await query(`
      DELETE FROM jobs
      WHERE job_id IN (?, ?)
    `, [JOB1, JOB2]);

  });

  test("retry failed jobs enqueue", async () => {

    await retryFailedJobs();

    expect(enqueueBuild)
      .toHaveBeenCalledTimes(1);

    const payload =
      enqueueBuild.mock.calls[0][0];

    expect(payload.jobId)
      .toBe(JOB1);

  });

  test("retry_count 증가", async () => {

    await retryFailedJobs();

    const rows = await query(`
      SELECT retry_count
      FROM jobs
      WHERE job_id = ?
    `, [JOB1]);

    expect(rows[0].retry_count)
      .toBe(1);

  });

  test("max_retry 초과 job 보호", async () => {

    await retryFailedJobs();

    const calls =
      enqueueBuild.mock.calls
        .map(c => c[0].jobId);

    expect(calls)
      .not.toContain(JOB2);

  });

});