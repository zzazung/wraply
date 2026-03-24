// wraply-worker/tasks/index.js

const generateContent = require("./generateContent");
const generateMarketing = require("./generateMarketing");

const { runAds } = require("./tools/ads");
const { sendSlackMessage } = require("./tools/slack");
const { createNotionPage } = require("./tools/notion");

const tasks = {

  /* -----------------------------
     Agent Tasks (LLM)
  ----------------------------- */

  generate_content: generateContent,
  generate_marketing: generateMarketing,

  /* -----------------------------
     Tool Tasks (Adapter Layer 필수)
  ----------------------------- */

  run_ads: async (payload) => {

    const res = await runAds({
      ...payload,
      task: "run_ads"
    });

    if (!res.success) {
      throw new Error(res.error || "run_ads failed");
    }

    return res.data;

  },

  send_slack: async (payload) => {

    const res = await sendSlackMessage({
      ...payload,
      task: "send_slack"
    });

    if (!res.success) {
      throw new Error(res.error || "send_slack failed");
    }

    return res.data;

  },

  create_notion_page: async (payload) => {

    const res = await createNotionPage({
      ...payload,
      task: "create_notion_page"
    });

    if (!res.success) {
      throw new Error(res.error || "create_notion_page failed");
    }

    return res.data;

  }

};

/* --------------------------------------------------
   🔥 Unified Task Runner (중앙 실행 엔진)
-------------------------------------------------- */

async function runTask({ jobId, task, context, meta }) {

  console.log("[worker] run:", {
    jobId,
    task
  });

  const handler = tasks[task];

  if (!handler) {
    throw new Error(`Unknown task: ${task}`);
  }

  const result = await handler({
    jobId,
    context,
    meta
  });

  return result;

}

module.exports = {
  runTask
};