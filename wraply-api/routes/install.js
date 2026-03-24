const express = require("express");
const router = express.Router();

const {
  getArtifactById
} = require("@wraply/shared/storage/artifactStorage");

function renderPage(res, artifact) {

  const base = process.env.BASE_URL || "http://localhost:4000";

  const fileUrl = `${base}/artifacts/${artifact.platform}/${artifact.path}`;

  let installSection = "";

  if (artifact.platform === "android") {

    installSection = `
      <a href="${fileUrl}">
        <button>Download APK</button>
      </a>
    `;

  } else if (artifact.platform === "ios") {

    const manifestUrl =
      `${base}/install/${artifact.id}/manifest.plist`;

    const installUrl =
      `itms-services://?action=download-manifest&url=${manifestUrl}`;

    installSection = `
      <a href="${installUrl}">
        <button>Install iOS App</button>
      </a>
      <p style="color:#666;margin-top:10px">
        Safari에서 열어주세요
      </p>
    `;

  }

  res.setHeader("Content-Type", "text/html");

  res.send(`
<html>
<head>
<title>Wraply Install</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body{font-family:Arial;padding:40px;text-align:center}
button{padding:14px 22px;font-size:16px;margin-top:10px}
.meta{color:#666;margin-top:10px}
</style>
</head>
<body>

<h2>${artifact.appName}</h2>

<p class="meta">Platform: ${artifact.platform}</p>

${installSection}

</body>
</html>
`);
}

/* ---------- install ---------- */

router.get("/:artifactId", async (req, res) => {

  const { artifactId } = req.params;

  const artifact = getArtifactById(artifactId);

  if (!artifact) {
    return res.status(404).send("Artifact not found");
  }

  renderPage(res, artifact);

});

/* ---------- iOS manifest ---------- */

router.get("/:artifactId/manifest.plist", async (req, res) => {

  const { artifactId } = req.params;

  const artifact = getArtifactById(artifactId);

  if (!artifact || artifact.platform !== "ios") {
    return res.status(404).send("Not found");
  }

  const base = process.env.BASE_URL || "http://localhost:4000";

  const ipaUrl =
    `${base}/artifacts/ios/${artifact.path}`;

  const plist = `<?xml version="1.0" encoding="UTF-8"?>
  <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
  <plist version="1.0">
    <dict>
      <key>items</key>
      <array>
        <dict>
          <key>assets</key>
          <array>
            <dict>
              <key>kind</key>
              <string>software-package</string>
              <key>url</key>
              <string>${ipaUrl}</string>
            </dict>
          </array>
          <key>metadata</key>
          <dict>
            <key>bundle-identifier</key>
            <string>${artifact.bundleId}</string>
            <key>bundle-version</key>
            <string>${artifact.version}</string>
            <key>kind</key>
            <string>software</string>
            <key>title</key>
            <string>${artifact.appName}</string>
          </dict>
        </dict>
      </array>
    </dict>
  </plist>`;

  res.set("Content-Type", "application/xml");
  res.send(plist);

});

module.exports = router;