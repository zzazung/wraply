// wraply-worker/tasks/tools/slack.js

const axios = require("axios");

async function sendSlackMessage({ jobId, task, context, meta }) {

  try {

    const text = context?.lastResult || "";

    console.log("[tool:slack] start", {
      jobId,
      task,
      text,
      meta
    });

    await axios.post(process.env.SLACK_WEBHOOK_URL, {
      text
    });

    return {
      success: true,
      data: "Slack message sent",
      logs: [`slack text: ${text}`]
    };

  } catch (err) {

    return {
      success: false,
      error: err.message
    };

  }

}

module.exports = { sendSlackMessage };