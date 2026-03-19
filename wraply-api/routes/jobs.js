// wraply-api/routes/jobs.js

const express = require("express")
const { v4: uuidv4 } = require("uuid")
const fs = require("fs")
const path = require("path")

const tenantDb = require("../lib/tenantDb")
const { enqueueBuild } = require("../queue/buildQueue")
const { CANCEL_CHANNEL } = require("@wraply/shared/constants/queues")

const { requireAuth } = require("../middleware/auth")

const router = express.Router()

router.use(requireAuth)

const CI_ROOT = process.env.CI_ROOT || process.cwd()

/**
 * 안전한 CI_ROOT 내부 경로만 허용
 */
function safeAbsPathFromCiRoot(relPath) {

  if (!relPath) return null

  const normalized = relPath.replace(/\\/g, "/")

  if (normalized.includes("..")) return null

  const abs = path.resolve(CI_ROOT, normalized)

  if (!abs.startsWith(path.resolve(CI_ROOT))) return null

  return abs

}

function rmrf(absPath) {

  try {

    if (absPath && fs.existsSync(absPath)) {

      fs.rmSync(absPath, { recursive: true, force: true })

      return true

    }

  } catch (err) {

    console.error("rmrf error:", err)

  }

  return false

}

/**
 * Job 생성
 */
router.post("/", async (req, res) => {

  try {

    const db = tenantDb(req)

    const {
      projectId,
      platform,
      packageName,
      appName,
      url,
      scheme
    } = req.body

    if (
      typeof projectId !== "string" ||
      typeof platform !== "string" ||
      typeof packageName !== "string"
    ) {
      return res.status(400).json({ error: "Invalid fields" })
    }

    /**
     * 🔥 project 소유권 검증 (핵심)
     */
    const project = await db.projects.findById(projectId)

    if (!project) {
      return res.status(404).json({ error: "Project not found" })
    }

    const jobId = uuidv4()
    const safeName = packageName.replace(/\./g, "_")

    await db.jobs.create({
      id: jobId,
      projectId,
      platform,
      packageName,
      safeName,
      appName,
      url,
      scheme
    })

    await enqueueBuild({
      jobId,
      tenantId: req.user.tenantId,
      projectId,
      platform,
      packageName,
      safeName,
      appName,
      url
    })

    res.json({ success: true, jobId })

  } catch (e) {

    console.error("job create error:", e)

    res.status(500).json({ error: "internal error" })

  }

})

/**
 * Job History
 */
router.get("/", async (req, res) => {

  try {

    const db = tenantDb(req)

    const jobs = await db.jobs.list()

    res.json({ items: jobs })

  } catch (err) {

    console.error("job list error:", err)

    res.status(500).json({ error: "internal error" })

  }

})

/**
 * Job Detail
 */
router.get("/:jobId", async (req, res) => {

  try {

    const db = tenantDb(req)

    const job = await db.jobs.findById(req.params.jobId)

    if (!job) {
      return res.status(404).json({ error: "Job not found" })
    }

    res.json(job)

  } catch (err) {

    console.error("job detail error:", err)

    res.status(500).json({ error: "internal error" })

  }

})

/**
 * Job Log
 */
router.get("/:jobId/log", async (req, res) => {

  try {

    const db = tenantDb(req)

    const job = await db.jobs.findById(req.params.jobId)

    if (!job || !job.log_path) {
      return res.status(404).json({ error: "Log not found" })
    }

    const abs = safeAbsPathFromCiRoot(job.log_path)

    if (!abs || !fs.existsSync(abs)) {
      return res.status(404).json({ error: "Log file missing" })
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8")

    fs.createReadStream(abs).pipe(res)

  } catch (err) {

    console.error("log read error:", err)

    res.status(500).json({ error: "internal error" })

  }

})

/**
 * Job Artifacts
 */
router.get("/:jobId/artifacts", async (req, res) => {

  try {

    const db = tenantDb(req)

    const items = await db.artifacts.listByJob(req.params.jobId)

    res.json({ items })

  } catch (err) {

    console.error("artifact list error:", err)

    res.status(500).json({ error: "internal error" })

  }

})

/**
 * Job Cancel
 */
router.post("/:jobId/cancel", async (req, res) => {

  try {

    const db = tenantDb(req)

    const job = await db.jobs.findById(req.params.jobId)

    if (!job)
      return res.status(404).json({ error: "Job not found" })

    const { isTerminal } =
      require("@wraply/shared/job/jobState")

    if (isTerminal(job.status))
      return res.status(400).json({ error: "Job already finished" })

    const redis = require("../lib/redis")

    await redis.publish(
      CANCEL_CHANNEL,
      JSON.stringify({
        jobId: job.job_id,
        tenantId: req.user.tenantId
      })
    )

    res.json({ success: true })

  } catch (err) {

    console.error("job cancel error:", err)

    res.status(500).json({ error: "internal error" })

  }

})

/**
 * Job Delete
 */
router.delete("/", async (req, res) => {

  try {

    const db = tenantDb(req)

    const jobIds = Array.isArray(req.body?.jobIds)
      ? req.body.jobIds
      : []

    if (!jobIds.length)
      return res.status(400).json({ error: "jobIds is required" })

    const jobs = await db.jobs.findMany(jobIds)

    const deletedFiles = []

    for (const job of jobs) {

      const artifactAbs =
        safeAbsPathFromCiRoot(job.artifact_dir)

      const logAbs =
        safeAbsPathFromCiRoot(job.log_path)

      if (artifactAbs && rmrf(artifactAbs))
        deletedFiles.push({ jobId: job.job_id })

      if (logAbs && rmrf(logAbs))
        deletedFiles.push({ jobId: job.job_id })

    }

    const deletedCount =
      await db.jobs.deleteMany(jobIds)

    res.json({
      success: true,
      deletedCount,
      deletedFiles
    })

  } catch (err) {

    console.error("job delete error:", err)

    res.status(500).json({ error: "internal error" })

  }

})

module.exports = router