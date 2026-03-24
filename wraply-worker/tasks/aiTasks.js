// wraply-worker/tasks/aiTasks.js

const handlers = {

  generate_product: async payload => {
    return "상품 생성 결과";
  },

  generate_ads: async payload => {
    return "광고 생성 결과";
  },

  analyze_sales: async payload => {
    return "매출 분석 결과";
  }

};

async function runTask(task, payload){

  const handler = handlers[task];

  if (!handler) {
    throw new Error(`Unknown task: ${task}`);
  }

  return await handler(payload);

}

module.exports = {
  runTask
};