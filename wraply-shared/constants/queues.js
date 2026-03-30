// wraply-shared/constants/queues.js

module.exports = {

  /* --------------------------------------------------
     Queue Names (⚠️ BullMQ: ":" 금지)
  -------------------------------------------------- */

  BUILD_QUEUE: "wraply-build",

  AI_QUEUE: "wraply-ai",

  TARGET_QUEUE: "wraply-target",   // 🔥 추가 (추천)

  /* --------------------------------------------------
     Pub/Sub Channels (⭕ ":" 사용 OK)
  -------------------------------------------------- */

  LOG_CHANNEL: "wraply:logs",

  STATUS_CHANNEL: "wraply:status",

  HEARTBEAT_CHANNEL: "wraply:heartbeat",

  CANCEL_CHANNEL: "wraply:cancel",

  AGENT_EVENT_CHANNEL: "wraply:agent:event",

  AGENT_LOG_CHANNEL: "wraply:agent:logs",

  /* 🔥 Workflow */

  WORKFLOW_NEXT_CHANNEL: "wraply:workflow:next",   // 🔥 핵심 추가

  WORKFLOW_EVENT_CHANNEL: "wraply:workflow:event"

};