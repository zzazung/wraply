const { buildQueue } = require("@wraply/shared/queue");

/**
 * enqueue build job
 */
async function enqueueBuild(data) {
  if (!data || typeof data !== "object") {
    throw new Error("invalid build job payload");
  }

  const jobId = data.jobId || `build_${Date.now()}`;

  const job = await buildQueue.add(
    "build",
    data,
    { jobId }
  );

  return job.id;
}

module.exports = {
  enqueueBuild,
  buildQueue
};