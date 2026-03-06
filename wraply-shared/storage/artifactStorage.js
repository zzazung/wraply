const fs = require("fs")
const path = require("path")

const ARTIFACT_ROOT =
  process.env.ARTIFACT_DIR || path.join(process.cwd(), "artifacts")

function getJobDir(jobId) {
  return path.join(ARTIFACT_ROOT, jobId)
}

function listArtifacts(jobId) {

  const dir = getJobDir(jobId)

  if (!fs.existsSync(dir)) return []

  return fs.readdirSync(dir).map(file => ({
    file,
    path: path.join(dir, file)
  }))
}

function getArtifact(jobId, file) {

  const p = path.join(getJobDir(jobId), file)

  if (!fs.existsSync(p)) return null

  return p
}

module.exports = {
  listArtifacts,
  getArtifact,
  getJobDir
}