const express = require("express");
const path = require("path");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const jobsRouter = require("./routes/jobs");
const artifactRoutes = require("./routes/artifacts");
const installRoutes = require("./routes/install");
const androidSigningRouter = require("./routes/signing.android");
const internalRouter = require("./routes/internal");

const CI_ROOT = process.env.CI_ROOT || "/ci";

const app = express();

app.set("trust proxy", true);

const corsOptions = {
  origin(origin, callback) {

    const allowed = [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173",
      "http://192.168.0.177:3000",
      "http://192.168.0.177:3001",
      "http://192.168.0.177:5173",
    ];

    if (!origin || allowed.includes(origin)) {
      callback(null, origin);
    } else {
      callback(new Error("Not allowed by CORS"));
    }

  },
  credentials: true
};

app.use(cors(corsOptions));

app.use(express.json({
  limit: "2mb"
}));

app.use(express.urlencoded({
  extended: true,
  limit: "2mb"
}));

app.use(
  "/downloads",
  express.static(
    path.join(CI_ROOT, "builds"),
    {
      fallthrough: false,
      index: false
    }
  )
);

app.use("/auth", authRoutes);
app.use("/projects", projectRoutes);
app.use("/jobs", jobsRouter);
app.use("/artifacts", artifactRoutes);
app.use("/install", installRoutes);
app.use("/android/signing", androidSigningRouter);
app.use("/internal", internalRouter);

/**
 * 404 handler
 */
app.use((req, res) => {

  res.status(404).json({
    error: "not found"
  });

});

/**
 * error handler
 */
app.use((err, req, res, next) => {

  console.error("API ERROR:", err);

  res.status(err.status || 500).json({
    error: err.message || "internal error"
  });

});

module.exports = app;