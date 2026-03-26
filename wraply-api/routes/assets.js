// wraply-api/routes/assets.js

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const upload = multer({ dest: "/tmp" });

router.post(
  "/projects/:projectId/assets",
  upload.fields([
    { name: "icon", maxCount: 1 },
    { name: "splash", maxCount: 1 }
  ]),
  async (req, res) => {

    const { projectId } = req.params;
    const tenantId = req.user.tenantId;

    const baseDir = path.join(
      process.env.WRAPLY_ROOT,
      "storage",
      "tenants",
      tenantId,
      "assets"
    );

    fs.mkdirSync(baseDir, { recursive: true });

    let iconPath = null;
    let splashPath = null;

    if (req.files.icon){

      const file = req.files.icon[0];

      const dest = path.join(baseDir, "icon.png");

      fs.renameSync(file.path, dest);

      iconPath = path.relative(process.env.WRAPLY_ROOT, dest);

    }

    if (req.files.splash){

      const file = req.files.splash[0];

      const dest = path.join(baseDir, "splash.png");

      fs.renameSync(file.path, dest);

      splashPath = path.relative(process.env.WRAPLY_ROOT, dest);

    }

    // DB 저장 (projects.settings 또는 별도 테이블)
    await query(`
      UPDATE projects
      SET settings = JSON_SET(
        settings,
        '$.assets.iconPath', ?,
        '$.assets.splashPath', ?
      )
      WHERE id=? AND tenant_id=?
    `, [
      iconPath,
      splashPath,
      projectId,
      tenantId
    ]);

    res.json({
      iconPath,
      splashPath
    });

  }
);

module.exports = router;