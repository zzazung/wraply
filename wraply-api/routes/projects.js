// wraply-api/routes/projects.js

const express = require("express");
const { v4: uuidv4 } = require("uuid");

const tenantDb = require("../lib/tenantDb");
const { requireAuth } = require("../middleware/auth");

const { enqueueBuild } = require("../queue/buildQueue");

const router = express.Router()

/**
 * Project List
 */
router.get("/", requireAuth, async (req, res) => {

  try {

    const db = tenantDb(req)

    const projects = await db.projects.list()

    res.json({ items: projects })

  } catch (err) {

    console.error("project list error:", err)
    res.status(500).json({ error: "internal error" })

  }

})

/**
 * Project Create
 */
router.post("/", requireAuth, async (req, res) => {

  try {

    const db = tenantDb(req)

    const {
      name,
      packageName,
      bundleId
    } = req.body

    if (!name || !packageName) {
      return res.status(400).json({ error: "Invalid fields" })
    }

    const id = uuidv4()
    const safeName = packageName.replace(/\./g, "_")

    await db.projects.create({
      id,
      name,
      safeName,
      packageName,
      bundleId
    })

    res.json({ id })

  } catch (err) {

    console.error("project create error:", err)
    res.status(500).json({ error: "internal error" })

  }

})

/**
 * Project Detail
 */
router.get("/:projectId", requireAuth, async (req, res) => {

  try {

    const db = tenantDb(req)

    const project = await db.projects.findById(req.params.projectId)

    if (!project) {
      return res.status(404).json({ error: "Project not found" })
    }

    res.json(project)

  } catch (err) {

    console.error("project detail error:", err)
    res.status(500).json({ error: "internal error" })

  }

})

/**
 * Project Builds (History)
 */
router.get("/:projectId/builds", requireAuth, async (req, res) => {

  try {

    const db = tenantDb(req)
    const { projectId } = req.params

    /**
     * project 소유권 검증 (중요)
     */
    const project = await db.projects.findById(projectId)

    if (!project) {
      return res.status(404).json({ error: "Project not found" })
    }

    const builds = await db.jobs.listByProject(projectId)

    res.json({ items: builds })

  } catch (err) {

    console.error("project builds error:", err)
    res.status(500).json({ error: "internal error" })

  }

})

/**
 * ❗ LEGACY (권장: 삭제 예정)
 * Build Request → 반드시 /jobs로 이동 필요
 */
router.post("/:projectId/builds", requireAuth, async (req, res) => {

  try {

    const db = tenantDb(req)

    const { projectId } = req.params

    const {
      platform,
      packageName,
      appName,
      url,
      scheme
    } = req.body || {}

    if (!platform || !packageName) {
      return res.status(400).json({
        error: "Invalid fields"
      })
    }

    /**
     * project 검증 (중요)
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
      url
    })

    res.json({
      success: true,
      jobId
    })

  } catch (err) {

    console.error("build request error:", err)
    res.status(500).json({ error: "internal error" })

  }

})

module.exports = router