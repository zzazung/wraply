const express = require("express");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const { STATES } = require("wraply-shared/job/jobState");

/* --------------------------------------------------
   🔐 Mock Auth Middleware
-------------------------------------------------- */
router.use((req, res, next) => {

  const auth = req.headers.authorization;

  if (!auth) {

    return res.status(401).json({
      error: "Unauthorized"
    });

  }

  next();

});

/* --------------------------------------------------
   📁 Upload Setup
-------------------------------------------------- */

const uploadDir =
  path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {

  fs.mkdirSync(uploadDir, { recursive: true });

}

const storage = multer.diskStorage({

  destination: (_, __, cb) => {

    cb(null, uploadDir);

  },

  filename: (_, file, cb) => {

    const id = uuidv4();
    const ext =
      path.extname(file.originalname) || ".png";

    cb(null, id + ext);

  }

});

const upload =
  multer({ storage });

/* --------------------------------------------------
   🗂 In-Memory Store
-------------------------------------------------- */

const projects = [];
const splashAssets = {};
const builds = {};

/* --------------------------------------------------
   📦 Projects
-------------------------------------------------- */

// list
router.get("/projects", (req, res) => {

  res.json({ items: projects });

});

// create
router.post("/projects", (req, res) => {

  const {
    name,
    packageName,
    appName,
    serviceUrl
  } = req.body;

  const project = {

    id: uuidv4(),
    name,
    packageName,
    appName,
    serviceUrl,
    createdAt: new Date().toISOString(),

  };

  projects.push(project);

  splashAssets[project.id] = [];
  builds[project.id] = [];

  res.json({ project });

});

// detail
router.get("/projects/:projectId", (req, res) => {

  const p =
    projects.find(
      p => p.id === req.params.projectId
    );

  if (!p) {

    return res.status(404).json({
      error: "Not found"
    });

  }

  res.json({ project: p });

});

/* --------------------------------------------------
   🖼 Splash
-------------------------------------------------- */

// list
router.get("/projects/:projectId/splash", (req, res) => {

  res.json({
    items:
      splashAssets[
        req.params.projectId
      ] || []
  });

});


/**
 * upload splash image
 */
router.post(
  "/projects/:projectId/splash/upload",
  upload.single("file"),
  async (req, res) => {

    try {

      const projectId =
        req.params.projectId;

      if (!projects.find(
        p => p.id === projectId
      )) {

        return res.status(404).json({
          error: "Project not found"
        });

      }

      const file = req.file;

      if (!file) {

        return res.status(400).json({
          error: "file required"
        });

      }

      const outputPath =
        path.join(
          uploadDir,
          file.filename + ".png"
        );

      await sharp(file.path)
        .resize(1080, 1920, { fit: "cover" })
        .png({ quality: 90 })
        .toFile(outputPath);

      fs.unlinkSync(file.path);

      const asset = {

        id: uuidv4(),
        projectId,
        url:
          `/uploads/${file.filename}.png`,
        originalName:
          file.originalname,
        mime: "image/png",
        status: "active",
        createdAt:
          new Date().toISOString()

      };

      splashAssets[projectId].push(asset);

      res.json({ asset });

    } catch (err) {

      console.error(
        "splash upload error:",
        err
      );

      res.status(500).json({
        error: "upload failed"
      });

    }

  }
);


/**
 * activate splash
 */
router.post(
  "/projects/:projectId/splash/:assetId/activate",
  (req, res) => {

    const list =
      splashAssets[
        req.params.projectId
      ] || [];

    list.forEach(a => {
      a.status = "archived";
    });

    const asset =
      list.find(
        a => a.id === req.params.assetId
      );

    if (asset)
      asset.status = "active";

    res.json({ ok: true });

  }
);


/* --------------------------------------------------
   🏗 Builds
-------------------------------------------------- */

// request build
router.post(
  "/projects/:projectId/builds",
  (req, res) => {

    const { platform } = req.body;

    const jobId =
      "job_" + uuidv4();

    const job = {

      job_id: jobId,
      platform,
      status: STATES.QUEUED,
      progress: 0,
      package_name: "mock.package",
      app_name: "MockApp",
      url: "https://example.com",
      created_at:
        new Date().toISOString(),

    };

    builds[
      req.params.projectId
    ].push(job);

    setTimeout(() => {
      job.status = "building";
    }, 1000);

    setTimeout(() => {
      job.progress = 30;
    }, 2000);

    setTimeout(() => {
      job.progress = 60;
    }, 3000);

    setTimeout(() => {

      job.progress = 100;
      job.status = "completed";

    }, 5000);

    res.json({ jobId });

  }
);


// list builds
router.get(
  "/projects/:projectId/builds",
  (req, res) => {

    res.json({

      items:
        builds[
          req.params.projectId
        ] || []

    });

  }
);

module.exports = router;