// wraply-api/routes/agent.js

const express = require("express");
const router = express.Router();

const { createPlan } = require("../lib/agent/planner");
const { runWorkflow } = require("../lib/agent/workflowRunner");

router.post("/run", async (req, res) => {

  try {

    const { goal } = req.body;

    console.log("[agent] goal:", goal);

    // 1. planner
    const workflow = await createPlan(goal);

    console.log("[agent] workflow:", workflow);

    // 2. 실행
    const result = await runWorkflow({
      jobId: `job_${Date.now()}`,
      workflow
    });

    return res.json(result);

  } catch (err){

    console.error(err);

    res.status(500).json({
      error: "agent failed"
    });

  }

});

module.exports = router;