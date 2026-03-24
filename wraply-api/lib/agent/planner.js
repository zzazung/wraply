const { getTasks } = require("./taskService");
const { callLLM } = require("@wraply/shared/lib/llm");

async function createPlan({ goal, context }) {

  if (!goal) throw new Error("goal is required");

  // 🔥 DB에서 task 가져오기
  const tasks = await getTasks();

  const taskDescriptions = tasks.map(
    t => `- ${t.name}: ${t.description}`
  ).join("\n");

  const prompt = `
너는 쇼핑몰 자동화 AI planner다.

목표:
${goal}

사용 가능한 작업:
${taskDescriptions}

규칙:
- 반드시 JSON으로만 응답
- steps 배열 반환
- 각 step은 task 필드 포함

예시:
{
  "steps":[
    { "task":"generate_product" }
  ]
}

context:
${JSON.stringify(context, null, 2)}
`;

  let raw;

  try {

    raw = await callLLM({
      system: "반드시 JSON으로만 응답한다.",
      user: prompt
    });

  } catch (err) {

    console.error("[planner] LLM error:", err);

    return [{ task: "generate_product" }];

  }

  const cleaned = cleanJSON(raw);
  const parsed = safeParse(cleaned);

  return parsed.steps || [{ task: "generate_product" }];
}