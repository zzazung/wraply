// wraply-api/services/agent/evaluator.js

const { callLLM } = require("@wraply/shared/lib/llm");

/**
 * 🔥 prompt 생성
 */
function buildPrompt({ goal, context }) {

  return `
너는 Agent의 evaluator다.

목표:
${goal}

현재 상태:
${JSON.stringify(context, null, 2)}

판단 기준:
- 목표가 충분히 달성되었으면 → DONE
- 추가 작업이 필요하면 → CONTINUE
- 현재 방향이 틀렸으면 → REPLAN

규칙:
- 반드시 하나만 출력
- 설명 금지

가능한 응답:
DONE
CONTINUE
REPLAN
`;

}

/**
 * 🔥 결과 파싱
 */
function parseDecision(text = "") {

  const cleaned = text.trim().toUpperCase();

  if (cleaned.includes("DONE")) return "DONE";
  if (cleaned.includes("REPLAN")) return "REPLAN";

  return "CONTINUE";

}

/**
 * 🔥 Evaluator 실행
 */
async function evaluateGoal({ goal, context }) {

  try {

    const prompt = buildPrompt({ goal, context });

    const raw = await callLLM({
      type: "evaluator",
      input: {
        goal,
        context,
        prompt
      }
    });

    const decision = parseDecision(raw);

    console.log("[evaluator] decision:", decision);

    return decision;

  } catch (err) {

    console.error("[evaluator] error:", err.message);

    return "CONTINUE";

  }

}

module.exports = {
  evaluateGoal
};