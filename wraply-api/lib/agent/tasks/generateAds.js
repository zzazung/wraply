// wraply-api/lib/agent/tasks/generateAds.js

const { callAI } = require("../../aiRouter");

module.exports = async function({ context }){

  const res = await callAI({
    type: "executor",
    payload: {
      action: "광고 생성",
      product: context.generate_product
    }
  });

  return res;
};