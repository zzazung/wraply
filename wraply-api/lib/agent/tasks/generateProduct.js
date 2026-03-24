// wraply-api/lib/agent/tasks/generateProduct.js

const { callAI } = require("../../aiRouter");

module.exports = async function({ jobId, context }){

  console.log("[task] generate_product");

  const res = await callAI({
    type: "planner",
    payload: {
      action: "상품 기획",
      goal: "쇼핑몰 매출 증가",
      context
    }
  });

  return res;
};