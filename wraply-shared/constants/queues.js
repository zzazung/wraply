// wraply-shared/constants/queues.js

module.exports = {

  /* --------------------------------------------------
     Queue Names (⚠️ BullMQ: ":" 금지)
  -------------------------------------------------- */

  BUILD_QUEUE: "wraply-build",

  AI_QUEUE: "wraply-ai",

  /* --------------------------------------------------
     Pub/Sub Channels (⭕ ":" 사용 OK)
  -------------------------------------------------- */

  LOG_CHANNEL: "wraply:logs",

  STATUS_CHANNEL: "wraply:status",

  HEARTBEAT_CHANNEL: "wraply:heartbeat",

  CANCEL_CHANNEL: "wraply:cancel",

  AGENT_EVENT_CHANNEL: "wraply:agent:event",

  AGENT_LOG_CHANNEL: "wraply:agent:logs"

};