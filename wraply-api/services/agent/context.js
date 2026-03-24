const { TASK_SCHEMA } = require("@wraply/shared/lib/agent/taskSchema");

/**
 * 🔥 필요한 context만 추출
 */
function pickContext(task, fullContext) {

  const schema = TASK_SCHEMA[task];

  if (!schema) return fullContext;

  const picked = {};

  for (const key of schema.input) {

    if (fullContext[key] !== undefined) {
      picked[key] = fullContext[key];
    }

  }

  return picked;

}

module.exports = {
  pickContext
};