// wraply-api/services/planner.js

const { callLLM } = require("@wraply/shared/lib/llm");

const DEFAULT_TASKS = [
  "generate_product",
  "generate_ads",
  "customer_support",
  "analyze_reviews",
  "analyze_sales"
];

/**
 * 🔥 planner prompt 생성
 */
function buildPrompt({ goal, context = {} }) {

  return `
너는 쇼핑몰 운영 자동화 AI Planner이다.

목표:
${goal}

사용 가능한 작업 목록:
${DEFAULT_TASKS.map(t => `- ${t}`).join("\n")}

규칙:
- 반드시 JSON으로만 응답
- steps 배열로 반환
- 각 step은 task 필드 포함
- 불필요한 설명 금지

예시:
{
  "steps":[
    { "task":"generate_product" },
    { "task":"generate_ads" }
  ]
}

context:
${JSON.stringify(context, null, 2)}
`;

}

/**
 * 🔥 JSON 코드블럭 제거
 */
function cleanJSON(text) {

  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

}

/**
 * 🔥 JSON 안전 파싱
 */
function safeParse(jsonString) {

  try {
    return JSON.parse(jsonString);
  } catch (err) {

    console.error("[planner] JSON parse error:", err);
    console.error("[planner] raw:", jsonString);

    return {
      steps: [{ task: "generate_product" }]
    };

  }

}

/**
 * 🔥 플랜 생성 (핵심)
 */
async function createPlan({ goal, context }) {

  if (!goal) {
    throw new Error("goal is required");
  }

  const prompt = buildPrompt({ goal, context });

  let raw;

  try {

    raw = await callLLM({
      system: "너는 workflow를 생성하는 AI planner다. 반드시 JSON으로만 응답한다.",
      user: prompt
    });

  } catch (err) {

    console.error("[planner] LLM error:", err.message);

    return [
      { task: "generate_product" },
      { task: "generate_ads" }
    ];

  }

  const cleaned = cleanJSON(raw);

  const parsed = safeParse(cleaned);

  if (!parsed.steps || !Array.isArray(parsed.steps)) {

    console.error("[planner] invalid response:", parsed);

    return [
      { task: "generate_product" }
    ];

  }

  return parsed.steps;

}

/**
 * 🔥 workflow 변환
 */
function buildWorkflow(steps) {

  return steps.map((step, index) => ({
    id: `step_${index + 1}`,
    task: step.task,
    status: "pending"
  }));

}

/**
 * 🔥 planner → workflow
 */
async function createWorkflowFromGoal({ goal, context }) {

  const steps = await createPlan({ goal, context });

  const workflow = buildWorkflow(steps);

  return {
    goal,
    steps,
    workflow
  };

}

/**
 * 🔥 유효성 체크
 */
function validateTasks(steps) {

  return steps.filter(step => DEFAULT_TASKS.includes(step.task));

}

module.exports = {
  createPlan,
  createWorkflowFromGoal,
  validateTasks
};