const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* --------------------------------
   안전 파서 (핵심)
-------------------------------- */

function safe(text){

  if (!text) return "";

  const trimmed = String(text).trim();

  // JSON 형태일 때만 파싱
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  return trimmed;

}

/* --------------------------------
   OpenAI 호출 (공통)
-------------------------------- */

async function callOpenAI({ model, input, maxTokens }){

  const res = await openai.responses.create({
    model,
    input: typeof input === "string" ? input : JSON.stringify(input),
    max_output_tokens: maxTokens
  });

  return safe(res.output?.[0]?.content?.[0]?.text);

}

/* --------------------------------
   메인 generate (핵심)
-------------------------------- */

async function generate({ type, input }){

  console.log("[LLM] type:", type);

  /* -----------------------------
     1. planner (🔥 무조건 OpenAI)
  ----------------------------- */

  if (type === "planner"){

    return await callOpenAI({
      model: "gpt-4.1-mini",
      input,
      maxTokens: 500
    });

  }

  /* -----------------------------
     2. evaluator
  ----------------------------- */

  if (type === "evaluator"){

    return await callOpenAI({
      model: "gpt-4.1-mini",
      input,
      maxTokens: 50
    });

  }

  /* -----------------------------
     3. executor
  ----------------------------- */

  if (type === "executor"){

    try {

      return await callOpenAI({
        model: "gpt-4.1-mini",
        input,
        maxTokens: 500
      });

    } catch (err){

      console.error("[LLM] executor failed:", err.message);

      // fallback
      return await callOpenAI({
        model: "gpt-4.1-nano",
        input,
        maxTokens: 300
      });

    }

  }

  /* -----------------------------
     fallback
  ----------------------------- */

  return await callOpenAI({
    model: "gpt-4.1-nano",
    input,
    maxTokens: 300
  });

}

/* --------------------------------
   표준 인터페이스
-------------------------------- */

async function callLLM(params){
  return generate(params);
}

module.exports = {
  callLLM,
  generate
};