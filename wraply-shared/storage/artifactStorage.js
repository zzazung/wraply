const fs = require("fs");
const path = require("path");

const ARTIFACT_ROOT =
  process.env.ARTIFACT_DIR || path.join(process.cwd(), "artifacts");

function ensureDir(dir) {

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

}

function getJobDir(jobId) {

  const dir = path.join(ARTIFACT_ROOT, jobId);

  ensureDir(dir);

  return dir;

}

function listArtifacts(jobId) {

  const dir = getJobDir(jobId);

  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir).map(file => ({
    file,
    path: path.join(dir, file)
  }));

}

function getArtifact(jobId, file) {

  const p = path.join(getJobDir(jobId), file);

  if (!fs.existsSync(p)) return null;

  return p;

}

/**
 * artifact 파일 삭제
 */

function deleteArtifact(filePath) {

  if (!fs.existsSync(filePath)) return;

  fs.unlinkSync(filePath);

}

/**
 * job artifact 전체 삭제
 */

function deleteJobArtifacts(jobId) {

  const dir = getJobDir(jobId);

  if (!fs.existsSync(dir)) return;

  fs.rmSync(
    dir,
    {
      recursive: true,
      force: true
    }
  );

}

module.exports = {
  listArtifacts,
  getArtifact,
  getJobDir,
  deleteArtifact,
  deleteJobArtifacts
};