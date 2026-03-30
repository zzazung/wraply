// wraply-api/routes/workflows.js

const express = require("express");
const { query } = require("@wraply/shared/db");
const { startWorkflow } = require("../services/workflowService");

const router = express.Router();

/* workflow 조회 */

router.get("/:id", async (req, res) => {

  try {

    const { tenantId } = req.user;
    const { id } = req.params;

    /* ---------------- workflow ---------------- */

    const rows = await query(`
      SELECT
        id,
        status,
        current_step,
        created_at,
        updated_at
      FROM workflow_runs
      WHERE id=? AND tenant_id=?
    `, [id, tenantId]);

    if (!rows.length) {
      return res.status(404).json({ error: "not found" });
    }

    const workflow = rows[0];

    /* ---------------- jobs (steps) ---------------- */

    const jobs = await query(`
      SELECT
        job_id,
        step_index,
        status,
        progress,
        settings
      FROM jobs
      WHERE workflow_id=? AND tenant_id=?
      ORDER BY step_index ASC
    `, [id, tenantId]);

    const steps = jobs.map(j => {

      const settings = JSON.parse(j.settings || "{}");

      return {
        stepIndex: j.step_index,
        target: settings?.target?.type || null,
        status: j.status,
        progress: j.progress,
        jobId: j.job_id
      };

    });

    res.json({
      workflow: {
        id: workflow.id,
        status: workflow.status,
        currentStep: workflow.current_step,
        totalSteps: steps.length,
        createdAt: workflow.created_at,
        updatedAt: workflow.updated_at
      },
      steps
    });

  } catch (err) {

    console.error("[workflow] get error:", err);

    res.status(500).json({ error: "internal error" });

  }

});

/* workflow 실행 */

router.post("/run", async (req, res) => {

  try {

    const { tenantId } = req.user;
    const { projectId, workflow } = req.body;

    if (!projectId || !Array.isArray(workflow) || workflow.length === 0) {
      return res.status(400).json({ error: "Invalid workflow" });
    }

    const workflowId = await startWorkflow({
      tenantId,
      projectId,
      workflow
    });

    res.json({ workflowId });

  } catch (err) {

    console.error("[workflow] start error:", err);

    res.status(500).json({ error: "failed to start workflow" });

  }

});

router.get("/project/:projectId", async (req,res)=>{

  const { tenantId } = req.user;
  const { projectId } = req.params;

  const rows = await query(`
    SELECT *
    FROM workflows
    WHERE tenant_id = ? AND project_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `,[tenantId, projectId]);

  if(!rows.length){
    return res.status(404).json({ error:"not found" });
  }

  res.json(rows[0]);

});

module.exports = router;