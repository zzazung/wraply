const express = require("express")

const db = require("@wraply/shared/db")
const artifactStorage =
  require("@wraply/shared/storage/artifactStorage")

const router = express.Router()


router.get("/:jobId", async (req, res) => {

  try {

    const { jobId } = req.params

    const rows = await db.query(
      "SELECT * FROM jobs WHERE job_id=?",
      [jobId]
    )

    const job = rows[0]

    if (!job) {
      return res.status(404).json({
        error: "job not found"
      })
    }

    const files =
      await artifactStorage.list(jobId)

    res.json({
      jobId,
      files
    })

  } catch (err) {

    console.error(err)

    res.status(500).json({
      error: "artifact list failed"
    })

  }

})


router.get("/:jobId/:file", async (req, res) => {

  try {

    const { jobId, file } = req.params

    const rows = await db.query(
      "SELECT * FROM jobs WHERE job_id=?",
      [jobId]
    )

    const job = rows[0]

    if (!job) {
      return res.status(404).json({
        error: "job not found"
      })
    }

    const stream =
      await artifactStorage.getStream(
        jobId,
        file
      )

    if (!stream) {
      return res.status(404).json({
        error: "artifact not found"
      })
    }

    stream.pipe(res)

  } catch (err) {

    console.error(err)

    res.status(500).json({
      error: "artifact download failed"
    })

  }

})

module.exports = router