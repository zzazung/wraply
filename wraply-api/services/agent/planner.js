const { callLLM } = require("@wraply/shared/lib/llm");

const DEFAULT_TASKS = [
  "generate_content",
  "generate_marketing",
  "customer_support",
  "analyze_reviews",
  "analyze_sales",

  // 🔥 tools
  "send_slack",
  "create_notion_page",
  "run_ads"
];

const ALLOWED_TASKS = [
  "generate_content",
  "generate_marketing",
  "run_ads",
  "send_slack",
  "create_notion_page"
];

/* ---------------- prompt ---------------- */

function buildPrompt({ goal, context = {} }) {

  return `
너는 쇼핑몰 운영 자동화 AI Planner이다.

목표:
${goal}

사용 가능한 작업:

- generate_content: 상품 설명 생성
- generate_marketing: 광고 문구 생성
- customer_support: 고객 응대
- analyze_reviews: 리뷰 분석
- analyze_sales: 판매 데이터 분석
- run_ads: 광고 실행
- send_slack: Slack 알림 전송
- create_notion_page: Notion 문서 생성

규칙:
- 반드시 JSON으로만 응답
- steps 배열로 반환
- 각 step은 반드시 task 필드 포함
- task는 반드시 위 목록 중 하나만 사용
- 절대 설명하지 말 것

예시:
{
  "steps":[
    { "task":"generate_content" },
    { "task":"generate_marketing" },
    { "task":"run_ads" },
    { "task":"send_slack" }
  ]
}

context:
${JSON.stringify(context, null, 2)}
`;

}

/* ---------------- utils ---------------- */

function cleanJSON(text) {
  return String(text)
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

function safeParse(jsonString) {

  try {
    return JSON.parse(jsonString);
  } catch (err) {

    console.error("[planner] JSON parse error:", err);
    console.error("[planner] raw:", jsonString);

    return {
      steps: fallbackPlan("fallback")
    };

  }

}

/* ---------------- fallback ---------------- */

function fallbackPlan(goal){

  if (goal.includes("홍보")) {
    return [
      { task: "generate_content" },
      { task: "generate_marketing" },
      { task: "run_ads" },
      { task: "send_slack" }
    ];
  }

  return [{ task: "generate_content" }];

}

/* ---------------- create plan ---------------- */

async function createPlan({ goal, context }) {

  if (!goal) {
    throw new Error("goal is required");
  }

  const prompt = buildPrompt({ goal, context });

  let raw;

  try {

    raw = await callLLM({
      type: "planner",
      input: prompt
    });

  } catch (err) {

    console.error("[planner] LLM error:", err.message);

    return fallbackPlan(goal);

  }

  const cleaned =
  typeof raw === "string"
    ? cleanJSON(raw)
    : raw;

  const parsed =
    typeof cleaned === "string"
      ? safeParse(cleaned)
      : cleaned;

  if (!parsed.steps || !Array.isArray(parsed.steps)) {

    console.error("[planner] invalid response:", parsed);

    return fallbackPlan(goal);

  }

  /* 🔥 핵심 */
  const plan = validateTasks(parsed.steps);

  console.log("[planner] final plan:", plan);

  return plan;

}

/* --------------------------------------------------
   Task 검증 + 보정 (핵심)
-------------------------------------------------- */

function validateTasks(steps){

  if (!Array.isArray(steps)) return [];

  const valid = steps.filter(step =>
    step &&
    typeof step.task === "string" &&
    ALLOWED_TASKS.includes(step.task)
  );

  // 🔥 fallback 보호 (중요)
  if (valid.length === 0){

    console.warn("[planner] no valid tasks → fallback");

    return [
      { task: "generate_content" },
      { task: "generate_marketing" }
    ];

  }

  return valid;

}

/* ---------------- workflow ---------------- */

function buildWorkflow(steps) {

  return steps.map((step, index) => ({
    id: `step_${index + 1}`,
    task: step.task,
    status: "pending"
  }));

}

async function createWorkflowFromGoal({ goal, context }) {

  const steps = await createPlan({ goal, context });

  return {
    goal,
    steps,
    workflow: buildWorkflow(steps)
  };

}

module.exports = {
  createPlan,
  createWorkflowFromGoal,
  validateTasks
};