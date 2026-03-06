const express = require("express")
const fs = require("fs")
const path = require("path")
const pool = require("../db")

const router = express.Router()

const ARTIFACT_ROOT =
  process.env.ARTIFACT_DIR || path.join(process.cwd(), "artifacts")


// artifact list
router.get("/:jobId", async (req,res)=>{

  const { jobId } = req.params

  const [rows] = await pool.query(`
    SELECT
      id,
      file_name,
      file_size,
      file_type,
      created_at
    FROM artifacts
    WHERE job_id=?
    ORDER BY created_at DESC
  `,[jobId])

  res.json({
    jobId,
    items: rows
  })

})

// artifact download
router.get("/:jobId/:file", async (req, res) => {

  const { jobId, file } = req.params

  const filePath = path.join(
    ARTIFACT_ROOT,
    jobId,
    file
  )

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "artifact not found" })
  }

  res.download(filePath)

})

module.exports = router