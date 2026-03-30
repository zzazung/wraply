const {
  createPublisher,
  createSubscriber
} = require("../redis");

const { WORKFLOW_NEXT_CHANNEL } = require("../constants/queues");

/* --------------------------------------------------
   Publisher
-------------------------------------------------- */

const pub = createPublisher();

async function publishWorkflowNext(payload) {

  await pub.publish(
    WORKFLOW_NEXT_CHANNEL,
    JSON.stringify(payload)
  );

}

/* --------------------------------------------------
   Subscriber
-------------------------------------------------- */

let sub = null;

function subscribeWorkflowNext(handler) {

  if (sub && sub.status === "ready") return;

  sub = createSubscriber();

  /* 🔥 재연결 시 재구독 */
  sub.on("ready", () => {

    console.log("[workflowBus] ready, subscribing...");

    sub.subscribe(WORKFLOW_NEXT_CHANNEL);

  });

  sub.on("message", async (channel, message) => {

    if (channel !== WORKFLOW_NEXT_CHANNEL) return;

    try {

      const data = JSON.parse(message);

      /* 🔥 validation */
      if (!data?.workflowId || data.stepIndex == null){
        console.warn("[workflowBus] invalid payload:", data);
        return;
      }

      try {

        await handler(data);

      } catch (err) {

        console.error("[workflowBus] handler error:", err);

        /* 🔥 retry 1회 */
        try {
          await handler(data);
        } catch (err2) {
          console.error("[workflowBus] retry failed:", err2);
        }

      }

    } catch (err) {

      console.error("[workflowBus] parse error:", err);

    }

  });

  sub.on("error", (err) => {
    console.error("[workflowBus] redis error:", err);
  });

  sub.on("close", () => {
    console.warn("[workflowBus] connection closed");
  });

  sub.on("reconnecting", () => {
    console.warn("[workflowBus] reconnecting...");
  });

}

module.exports = {
  publishWorkflowNext,
  subscribeWorkflowNext
};