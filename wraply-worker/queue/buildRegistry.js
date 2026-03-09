const activeBuilds = new Map();

function registerBuild(jobId, proc) {

  activeBuilds.set(jobId, proc);

}

function unregisterBuild(jobId) {

  activeBuilds.delete(jobId);

}

function cancelBuild(jobId) {

  const proc = activeBuilds.get(jobId);

  if (!proc) return false;

  try {

    proc.kill("SIGKILL");

    return true;

  } catch {

    return false;

  }

}

module.exports = {
  registerBuild,
  unregisterBuild,
  cancelBuild
};