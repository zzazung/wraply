// wraply-api/lib/agent/tasks/analyzeSales.js

module.exports = async function(){

  console.log("[task] analyze_sales MOCK");

  return {
    summary: "매출 분석 결과 (mock)",
    insight: "현재 인기 상품 집중 필요"
  };

};