// wraply-worker/tasks/tools/ads.js

async function runAds({ jobId, task, context, meta }) {

  try {

    const content = context?.lastResult || "";

    console.log("[tool:ads] start", {
      jobId,
      task,
      content,
      meta
    });

    // TODO: 실제 광고 API 연동
    // await adsApi.launch(content);

    return {
      success: true,
      data: "Ads campaign launched",
      logs: [`ads input: ${content}`]
    };

  } catch (err) {

    return {
      success: false,
      error: err.message
    };

  }

}

module.exports = { runAds };