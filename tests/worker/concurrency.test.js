const { Queue } = require("bullmq")
const IORedis = require("ioredis")

describe("Multiple Build Jobs", () => {

  test("enqueue multiple builds", async () => {

    const connection = new IORedis()

    const queue = new Queue("build", { connection })

    const jobs = []

    for (let i = 0; i < 10; i++) {

      jobs.push(
        queue.add("build", {
          jobId: "job_" + i,
          platform: "android"
        })
      )

    }

    const result = await Promise.all(jobs)

    expect(result.length).toBe(10)

    await queue.close()
    await connection.quit()

  })

})