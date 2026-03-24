const { query, queryWithTenant } = require("@wraply/shared/db")
const Redis = require("ioredis")

const redis = new Redis(process.env.REDIS_URL)

const HEARTBEAT_TIMEOUT = 30000

/**
 * 🔥 key: tenantId:jobId
 */
const heartbeats = new Map()

function getKey(tenantId, jobId) {
  return `${tenantId}:${jobId}`
}

async function startHeartbeatListener(){

  await redis.subscribe("wraply:heartbeat")

  redis.on("message",(channel,message)=>{

    if(channel!=="wraply:heartbeat")
      return

    try{

      const payload = JSON.parse(message)

      /**
       * 🔥 tenant 포함 key 사용
       */
      if (!payload.tenantId || !payload.jobId) return

      heartbeats.set(
        getKey(payload.tenantId, payload.jobId),
        payload.ts
      )

    }catch{}

  })

}

async function checkBuilds(){

  /**
   * 🔥 tenant_id 포함 조회
   */
  const rows = await query(`
    SELECT job_id, tenant_id, status
    FROM jobs
    WHERE status IN
    ('preparing','patching','building','signing','uploading')
  `)

  const now = Date.now()

  for(const job of rows){

    const key = getKey(job.tenant_id, job.job_id)

    const ts = heartbeats.get(key)

    if(!ts){
      continue
    }

    if(now - ts > HEARTBEAT_TIMEOUT){

      console.log(
        "watchdog timeout",
        job.job_id,
        "tenant:",
        job.tenant_id
      )

      /**
       * 🔥 tenant-safe update
       */
      await queryWithTenant(
        job.tenant_id,
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