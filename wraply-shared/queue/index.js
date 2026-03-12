const { Queue } = require("bullmq");
const redis = require("../redis");

const buildQueue = new Queue(
  "wraply-build",
  {
    connection: redis
  }
);

async function enqueueBuild(data) {

  return buildQueue.add(
    "build",
    data,
    {
      removeOnComplete: true,
      removeOnFail: false
    }
  );

}

module.exports = {
  buildQueue,
  enqueueBuild
};