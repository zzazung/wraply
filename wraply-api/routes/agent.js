// wraply-api/routes/agent.js

const express = require("express");
const router = express.Router();

const { runAgentLoop } = require("../services/agent/agentLoop");
const { createPlan } = require("../services/agent/planner");
const { executeWorkflow } = require("../services/agent/workflow");

router.post("/", async (req, res) => {
  console.log("Authorization:", req.headers.authorization);
  console.log("req.user:", req.user);

  const { goal, context } = req.body;

  try {

    const finalContext = await runAgentLoop({

      goal,

      context,

      planner: async ({ goal, context }) => {
        return await createPlan({ goal, context });
      },

      executeWorkflow

    });

    res.json({
      success: true,
      context: finalContext
    });

  } catch (err) {

    console.error("[agent] error:", err);

    res.status(500).json({
      success: false,
      error: err.message
    });

  }

});

module.exports = router;