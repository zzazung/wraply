// wraply-api/lib/agent/executor.js

const tasks = {
  generate_product: require("./tasks/generateProduct"),
  generate_ads: require("./tasks/generateAds"),
  analyze_sales: require("./tasks/analyzeSales"),
  analyze_reviews: require("./tasks/analyzeReviews"),
  customer_support: require("./tasks/customerSupport")
};

async function runTask({ jobId, step, context }){

  console.log("[executor] run:", step.task);

  const handler = tasks[step.task];

  if (!handler){
    throw new Error(`No handler: ${step.task}`);
  }

  const result = await handler({
    jobId,
    context
  });

  return result;
}

module.exports = {
  runTask
};