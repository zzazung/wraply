const express = require("express");
const router = express.Router();

const { requireWorker } = require("../middleware/auth");

router.post("/job/update", requireWorker, async (req, res) => {

  const { jobId, status } = req.body;

  console.log("Worker update:", jobId, status);

  res.json({
    success: true
  });

});

module.exports = router;