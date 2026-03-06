const express = require("express")

const router = express.Router()

router.get("/:jobId", (req, res) => {

  const { jobId } = req.params

  const base = process.env.BASE_URL || "http://localhost:4000"

  const apkUrl = `${base}/artifacts/${jobId}/app-release.apk`

  res.send(`
  <html>
  <head>
    <title>Install Build</title>
  </head>

  <body style="font-family:sans-serif;text-align:center;margin-top:80px">

    <h2>Install Android Build</h2>

    <p>Job: ${jobId}</p>

    <a href="${apkUrl}">
      <button style="font-size:20px;padding:12px 24px">
        Download APK
      </button>
    </a>

  </body>
  </html>
  `)

})

module.exports = router