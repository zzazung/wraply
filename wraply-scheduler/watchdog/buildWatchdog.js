const { query } = require("@wraply/shared/db")
const Redis = require("ioredis")

const redis = new Redis(process.env.REDIS_URL)

const HEARTBEAT_TIMEOUT = 30000

const heartbeats = new Map()

async function startHeartbeatListener(){

  await redis.subscribe("wraply:heartbeat")

  redis.on("message",(channel,message)=>{

    if(channel!=="wraply:heartbeat")
      return

    try{

      const payload = JSON.parse(message)

      heartbeats.set(
        payload.jobId,
        payload.ts
      )

    }catch{}

  })

}

async function checkBuilds(){

  const rows = await query(`
    SELECT job_id,status
    FROM jobs
    WHERE status IN
    ('preparing','patching','building','signing','uploading')
  `)

  const now = Date.now()

  for(const job of rows){

    const ts = heartbeats.get(job.job_id)

    if(!ts){

      continue

    }

    if(now - ts > HEARTBEAT_TIMEOUT){

      console.log(
        "watchdog timeout",
        job.job_id
      )

      await query(
        `
        UPDATE jobs
        SET status='failed',
            progress=100,
            finished_at=NOW()
        WHERE job_id=?
        `,
        [job.job_id]
      )

    }

  }

}

function startWatchdog(){

  setInterval(
    checkBuilds,
    10000
  )

}

module.exports = {
  startWatchdog,
  startHeartbeatListener
}