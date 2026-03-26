const Redis = require("ioredis");

require('dotenv').config();

const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");

const {
  LOG_CHANNEL,
  STATUS_CHANNEL,
  AGENT_EVENT_CHANNEL,
  AGENT_LOG_CHANNEL
} = require("@wraply/shared/constants/queues");

async function publishLog(jobId, tenantId, message) {
  // await redis.publish("wraply:logs", JSON.stringify({
  //   type: "log",
  //   jobId,
  //   tenantId,
  //   message
  // }));

  await publishEvent({
    type:"log",
    jobId,
    tenantId,
    message
  });
}

async function publishStatus(jobId, tenantId, status, progress) {
  // await redis.publish("wraply:logs", JSON.stringify({
  //   type: "status",
  //   jobId,
  //   tenantId,
  //   status,
  //   progress
  // }));

  await publishEvent({
    type:"status",
    jobId,
    tenantId,
    status,
    progress
  });

}

async function publishAgentEvent({
  jobId,
  tenantId,
  event,
  step,
  output,
  error
}){

  await publishEvent({
    type:"agent_event",
    event,
    jobId,
    tenantId,
    step,
    data: output ?? null,
    error
  });

}

async function publishAgentStream({
  jobId,
  tenantId,
  step,
  token
}){

  await publishEvent({
    type:"agent_stream",
    jobId,
    tenantId,
    step,
    token
  });

}

async function publishEvent(event){

  let channel;

  if(event.type === "log"){
    channel = LOG_CHANNEL;
  }

  else if(event.type === "status"){
    channel = STATUS_CHANNEL;
  }

  else if(event.type === "agent_event"){
    channel = AGENT_EVENT_CHANNEL;
  }

  else if(event.type === "agent_stream"){
    channel = AGENT_EVENT_CHANNEL; // 🔥 동일 채널
  }

  else if(event.type === "agent_log"){
    channel = AGENT_LOG_CHANNEL;
  }

  else{
    console.warn("unknown event type:", event.type);
    return;
  }

  console.log("🔥 PUBLISH:", channel, event);

  await redis.publish(
    channel,
    JSON.stringify(event)
  );

}

module.exports = {
  publishLog,
  publishStatus,
  publishAgentEvent,
  publishAgentStream
};