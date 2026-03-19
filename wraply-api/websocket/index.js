// wraply-api/websocket/index.js

const WebSocket = require("ws")
const redis = require("@wraply/shared/redis")
const jwt = require("../lib/jwt")
const { query } = require("@wraply/shared/db")

const {
  LOG_CHANNEL,
  STATUS_CHANNEL,
  HEARTBEAT_CHANNEL
} = require("@wraply/shared/constants/queues")

const jobClients = new Map()

let wss = null
let redisSub = null
let heartbeatInterval = null

/* --------------------------------------------------
   broadcast
-------------------------------------------------- */

function broadcast(jobId, payload) {

  const clients = jobClients.get(jobId)
  if (!clients) return

  const message = JSON.stringify(payload)

  for (const ws of [...clients]) {

    if (ws.readyState === WebSocket.OPEN) {

      try {
        ws.send(message)
      } catch (err) {
        console.error("ws send error:", err)
        clients.delete(ws)
      }

    } else {

      clients.delete(ws)

    }

  }

  if (clients.size === 0)
    jobClients.delete(jobId)

}

/* --------------------------------------------------
   helpers
-------------------------------------------------- */

function broadcastLog(jobId, message) {

  broadcast(jobId, {
    type: "log",
    jobId,
    message,
    ts: Date.now()
  })

}

function broadcastStatus(jobId, status, progress) {

  broadcast(jobId, {
    type: "status",
    jobId,
    status,
    progress,
    ts: Date.now()
  })

}

/* --------------------------------------------------
   heartbeat update
-------------------------------------------------- */

async function updateHeartbeat(jobId, tenantId) {

  try {

    await query(
      `
      UPDATE jobs
      SET heartbeat_at = NOW()
      WHERE job_id = ?
      AND tenant_id = ?
      `,
      [jobId, tenantId]
    )

  } catch (err) {

    console.error("heartbeat update error:", err)

  }

}

/* --------------------------------------------------
   Redis subscriber
-------------------------------------------------- */

function initRedisSubscriber() {

  if (redisSub) return

  redisSub = redis.duplicate()

  redisSub.subscribe(
    LOG_CHANNEL,
    STATUS_CHANNEL,
    HEARTBEAT_CHANNEL
  )

  redisSub.on("message", async (channel, msg) => {

    let data

    try {
      data = JSON.parse(msg)
    } catch (err) {
      console.error("redis parse error:", err)
      return
    }

    if (!data?.jobId) return

    if (channel === HEARTBEAT_CHANNEL) {
      await updateHeartbeat(data.jobId, data.tenantId)
      return
    }

    if (channel === LOG_CHANNEL) {
      broadcastLog(data.jobId, data.message)
      return
    }

    if (channel === STATUS_CHANNEL) {
      broadcastStatus(data.jobId, data.status, data.progress)
    }

  })

}

/* --------------------------------------------------
   WebSocket server
-------------------------------------------------- */

function startWebSocket(server) {

  if (wss) return wss

  wss = new WebSocket.Server({ server })

  initRedisSubscriber()

  wss.on("connection", async (ws, req) => {

    try {

      const url = new URL(req.url, "http://localhost")

      const token = url.searchParams.get("token")
      const jobId = url.searchParams.get("jobId")

      if (!token || !jobId) {
        ws.close()
        return
      }

      /**
       * 🔥 JWT 검증 (핵심)
       */
      const payload = jwt.verifyToken(token)

      if (
        !payload ||
        typeof payload.userId !== "string" ||
        typeof payload.tenantId !== "string"
      ) {
        ws.close()
        return
      }

      const tenantId = payload.tenantId

      /**
       * 🔥 job tenant 검증 (핵심)
       */
      const rows = await query(
        `
        SELECT tenant_id
        FROM jobs
        WHERE job_id = ?
        LIMIT 1
        `,
        [jobId]
      )

      if (!rows.length || rows[0].tenant_id !== tenantId) {
        ws.close()
        return
      }

      /**
       * 🔥 연결 등록
       */
      if (!jobClients.has(jobId))
        jobClients.set(jobId, new Set())

      jobClients.get(jobId).add(ws)

      ws.isAlive = true
      ws.tenantId = tenantId
      ws.jobId = jobId

      ws.on("pong", () => {
        ws.isAlive = true
      })

      ws.on("close", () => {

        const clients = jobClients.get(jobId)
        if (!clients) return

        clients.delete(ws)

        if (clients.size === 0)
          jobClients.delete(jobId)

      })

      ws.on("error", err => {
        console.error("ws error:", err)
        try { ws.close() } catch {}
      })

    } catch (err) {

      console.error("WebSocket error:", err)
      try { ws.close() } catch {}

    }

  })

  heartbeatInterval = setInterval(() => {

    wss.clients.forEach(ws => {

      if (ws.isAlive === false) {
        try { ws.terminate() } catch {}
        return
      }

      ws.isAlive = false

      try {
        ws.ping()
      } catch {
        try { ws.terminate() } catch {}
      }

    })

  }, 30000)

  return wss

}

/* --------------------------------------------------
   graceful shutdown
-------------------------------------------------- */

async function closeWebSocket() {

  try {

    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }

    if (wss) {
      await new Promise(resolve => wss.close(resolve))
      wss = null
    }

    if (redisSub) {
      try { await redisSub.quit() } catch {}
      redisSub = null
    }

    jobClients.clear()

  } catch (err) {

    console.error("closeWebSocket error:", err)

  }

}

module.exports = {
  startWebSocket,
  closeWebSocket,
  broadcastLog,
  broadcastStatus
}