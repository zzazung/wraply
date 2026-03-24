// wraply-api/websocket/index.js

const WebSocket = require("ws")
const redis = require("@wraply/shared/redis")
const jwt = require("../lib/jwt")
const { query } = require("@wraply/shared/db")

const {
  LOG_CHANNEL,
  STATUS_CHANNEL,
  HEARTBEAT_CHANNEL,
  AGENT_EVENT_CHANNEL,   // 🔥 추가
  AGENT_LOG_CHANNEL      // 🔥 추가
} = require("@wraply/shared/constants/queues")

/**
 * 🔥 tenant 기반 연결 관리
 * tenantId → Set<WebSocket>
 */
const tenantClients = new Map()

let wss = null
let redisSub = null
let heartbeatInterval = null

/* --------------------------------------------------
   broadcast (tenant 기준)
-------------------------------------------------- */

function broadcastToTenant(tenantId, payload) {

  const clients = tenantClients.get(tenantId)
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
    tenantClients.delete(tenantId)

}

/* --------------------------------------------------
   helpers
-------------------------------------------------- */

function broadcastLog(tenantId, jobId, message) {

  broadcastToTenant(tenantId, {
    type: "log",
    jobId,
    message,
    ts: Date.now()
  })

}

function broadcastStatus(tenantId, jobId, status, progress) {

  broadcastToTenant(tenantId, {
    type: "status",
    jobId,
    status,
    progress,
    ts: Date.now()
  })

}

/* --------------------------------------------------
   🔥 Agent broadcast (추가만)
-------------------------------------------------- */

function broadcastAgentEvent(tenantId, data) {

  broadcastToTenant(tenantId, {
    type: "agent_event",
    ...data,
    ts: Date.now()
  })

}

function broadcastAgentLog(tenantId, data) {

  broadcastToTenant(tenantId, {
    type: "agent_log",
    ...data,
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
    HEARTBEAT_CHANNEL,
    AGENT_EVENT_CHANNEL,   // 🔥 추가
    AGENT_LOG_CHANNEL      // 🔥 추가
  )

  redisSub.on("message", async (channel, msg) => {
    let data

    try {
      data = JSON.parse(msg)
    } catch (err) {
      console.error("redis parse error:", err)
      return
    }

    if (!data?.jobId || !data?.tenantId) return

    if (channel === HEARTBEAT_CHANNEL) {
      await updateHeartbeat(data.jobId, data.tenantId)
      return
    }

    if (channel === LOG_CHANNEL) {
      broadcastLog(data.tenantId, data.jobId, data.message)
      return
    }

    if (channel === STATUS_CHANNEL) {
      broadcastStatus(
        data.tenantId,
        data.jobId,
        data.status,
        data.progress
      )
    }

    /* 🔥 Agent event 추가 */

    if (channel === AGENT_EVENT_CHANNEL) {
      broadcastAgentEvent(data.tenantId, data)
      return
    }

    if (channel === AGENT_LOG_CHANNEL) {
      broadcastAgentLog(data.tenantId, data)
      return
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

      console.log("[ws] connect attempt", { hasToken: !!token })

      if (!token) {
        console.log("[ws] reject: missing token")
        ws.close(4001, "missing token")
        return
      }

      /**
       * JWT 검증
       */
      const payload = jwt.verifyToken(token)

      if (
        !payload ||
        typeof payload.userId !== "string" ||
        typeof payload.tenantId !== "string"
      ) {
        console.log("[ws] reject: invalid token")
        ws.close(4001, "invalid token")
        return
      }

      const tenantId = payload.tenantId

      /**
       * 🔥 연결 등록 (tenant 기준)
       */
      if (!tenantClients.has(tenantId))
        tenantClients.set(tenantId, new Set())

      tenantClients.get(tenantId).add(ws)

      ws.isAlive = true
      ws.tenantId = tenantId

      console.log("[ws] connected", { tenantId })

      ws.on("pong", () => {
        ws.isAlive = true
      })

      ws.on("close", () => {

        console.log("[ws] closed", { tenantId })

        const clients = tenantClients.get(tenantId)
        if (!clients) return

        clients.delete(ws)

        if (clients.size === 0)
          tenantClients.delete(tenantId)

      })

      ws.on("error", err => {
        console.error("[ws] error:", err)
        try { ws.close() } catch {}
      })

    } catch (err) {

      console.error("[ws] fatal error:", err)
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

  console.log("[ws] server started")

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

    tenantClients.clear()

    console.log("[ws] server closed")

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