// wraply-api/services/agent/memoryService.js

function baseScore(output) {

  if (!output) return 0;

  const len = JSON.stringify(output).length;

  return Math.min(len / 200, 1); // 길이 기반
}

function successScore(success) {
  return success ? 1 : 0;
}

function calculateScore({ output, success }) {

  return (
    baseScore(output) * 0.4 +
    successScore(success) * 0.6
  );

}

function shouldStore(score) {
  return score >= 0.6;
}

module.exports = {
  calculateScore,
  shouldStore
};