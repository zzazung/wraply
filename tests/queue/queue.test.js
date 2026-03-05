const { Queue } = require("bullmq")
const IORedis = require("ioredis")

describe("Build Queue", () => {

  test("enqueue job", async () => {

    const connection = new IORedis()

    const queue = new Queue("test", { connection })

    const job = await queue.add("build", { foo: "bar" })

    expect(job.id).toBeDefined()

    await queue.close()
    await connection.quit()

  })

})