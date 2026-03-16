const express = require("express");
const router = express.Router();

const path = require("path");

const {
  getArtifact,
  listVersions
} = require("@wraply/shared/storage/artifactStorage");

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

function findApk(jobId, version = null) {

  const apk = getArtifact(jobId, "app-release.apk", version);

  if (apk) return apk;

  return null;

}

function renderPage(res, jobId, versionDir) {

  const base = process.env.BASE_URL || "http://localhost:4000";

  const apkUrl =
    `${base}/artifacts/android/${jobId}/${versionDir}/app-release.apk`;

  res.setHeader("Content-Type", "text/html");

  res.send(`
<html>
<head>
<title>Wraply Install</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body{font-family:Arial;padding:40px}
button{padding:14px 22px;font-size:16px}
.version{color:#666;margin-top:10px}
</style>
</head>
<body>

<h2>Install Android Build</h2>

<p>Job: ${jobId}</p>
<p class="version">Version: ${versionDir}</p>

<a href="${apkUrl}">
<button>Download APK</button>
</a>

</body>
</html>
`);
}

/* ---------- latest ---------- */

router.get("/:jobId", (req, res) => {

  const jobId = escapeHtml(req.params.jobId);

  const versions = listVersions(jobId)
    .sort()
    .reverse();

  if (!versions.length) {
    return res.status(404).send("APK not found");
  }

  const versionDir = versions[0];

  renderPage(res, jobId, versionDir);

});

/* ---------- specific version ---------- */

router.get("/:jobId/:version", (req, res) => {

  const jobId = escapeHtml(req.params.jobId);
  const version = escapeHtml(req.params.version);

  const apk = findApk(jobId, version);

  if (!apk) {
    return res.status(404).send("APK not found");
  }

  renderPage(res, jobId, version);

});

module.exports = router;