// wraply-shared/lib/llm/index.js

const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const gemini = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

/* --------------------------------
   공통 안전 파서
-------------------------------- */

function safe(text){

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }

}

/* --------------------------------
   OpenAI 호출
-------------------------------- */

async function callOpenAI({ model, input, maxTokens }){

  const res = await openai.responses.create({
    model,
    input: JSON.stringify(input),
    max_output_tokens: maxTokens
  });

  return safe(res.output?.[0]?.content?.[0]?.text);

}

/* --------------------------------
   Gemini 호출
-------------------------------- */

async function callGemini(input){

  const model = gemini.getGenerativeModel({
    model: "gemini-2.0-flash"
  });

  const res = await model.generateContent(
    JSON.stringify(input)
  );

  return safe(res.response.text());

}

/* --------------------------------
   메인 generate (핵심)
-------------------------------- */

async function generate({ type, input }){

  console.log("[LLM] type:", type);

  /* -----------------------------
     1. planner (Gemini → OpenAI fallback)
  ----------------------------- */

  if (type === "planner"){

    try {

      console.log("[LLM] planner → Gemini");

      return await callGemini(input);

    } catch (err){

      console.error("[LLM] Gemini failed:", err.message);

      // 👉 fallback
      console.log("[LLM] planner → OpenAI fallback");

      return await callOpenAI({
        model: "gpt-4.1-mini",
        input,
        maxTokens: 500
      });

    }

  }

  /* -----------------------------
     2. executor (OpenAI mini)
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

      // fallback nano
      return await callOpenAI({
        model: "gpt-4.1-nano",
        input,
        maxTokens: 300
      });

    }

  }

  /* -----------------------------
     3. fallback (nano)
  ----------------------------- */

  return await callOpenAI({
    model: "gpt-4.1-nano",
    input,
    maxTokens: 300
  });

}

module.exports = {
  generate
};