const express = require("express");
const router = express.Router();

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, function (m) {
    return ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[m];
  });
}

router.get("/:jobId", (req, res) => {
  const { jobId } = req.params;

  const safeJobId = escapeHtml(jobId);

  const base = process.env.BASE_URL || "http://localhost:4000";
  const apkUrl = `${base}/artifacts/${safeJobId}/app-release.apk`;

  res.setHeader("Content-Type", "text/html");

  res.send(`
<html>
<head>
<title>Wraply Install</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body{font-family:Arial;padding:40px}
button{padding:14px 22px;font-size:16px}
</style>
</head>
<body>

<h2>Install Android Build</h2>

<p>Job: ${safeJobId}</p>

<a href="${apkUrl}">
<button>Download APK</button>
</a>

</body>
</html>
`);
});

module.exports = router;