// wraply-api/lib/aiRouter.js

const { hash, getCache, setCache } = require("./aiCache");

// 👇 이걸로 통합
const llm = require("@wraply/shared/lib/llm");

async function callAI({ type, payload }){

  const key = hash({ type, payload });

  const cached = await getCache(key);
  if (cached){
    console.log("[AI] cache hit");
    return cached;
  }

  let result;

  try {

    console.log("[AI] call:", type);

    // 👇 여기 핵심
    result = await llm.generate({
      type,       // planner | executor
      input: payload
    });

  } catch (err){

    console.error("[AI] failed:", err.message);

    // fallback
    result = await llm.generate({
      type: "fallback",
      input: payload
    });

  }

  await setCache(key, result, 3600);

  return result;
}

module.exports = {
  callAI
};