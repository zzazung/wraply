const express = require("express");
const router = express.Router();

const { runAgentLoop } = require("../services/agent/agentLoop");
const { createPlan } = require("../services/agent/planner");
const { executeWorkflow } = require("../services/agent/workflow");

router.post("/", async (req, res) => {

  console.log("Authorization:", req.headers.authorization);
  console.log("req.user:", req.user);

  const { goal, context } = req.body;

  const { userId, tenantId } = req.user; // 🔥 핵심

  try {

    const finalContext = await runAgentLoop({

      userId,       // 🔥 추가
      tenantId,     // 🔥 추가

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

router.get("/:jobId", async (req, res) => {

  const { jobId } = req.params;
  const { tenantId } = req.user;

  try {

    const [job] = await query(`
      SELECT *
      FROM agent_jobs
      WHERE id = ? AND tenant_id = ?
    `, [jobId, tenantId]);

    if (!job) {
      return res.status(404).json({ error: "not found" });
    }

    const steps = await query(`
      SELECT step, status, output, created_at
      FROM agent_steps
      WHERE job_id = ?
      ORDER BY created_at ASC
    `, [jobId]);

    res.json({
      job,
      steps
    });

  } catch (err) {

    console.error("[agent] get error:", err);
    res.status(500).json({ error: "internal error" });

  }

});

module.exports = router;