const fs = require("fs");
const path = require("path");

const ARTIFACT_ROOT =
  process.env.ARTIFACT_DIR || path.join(process.cwd(), "artifacts");

function ensureDir(dir) {

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

}

/* ---------- job dir ---------- */

function getJobDir(jobId) {

  const dir = path.join(ARTIFACT_ROOT, platform, jobId);

  ensureDir(dir);

  return dir;

}

/* ---------- version dir ---------- */

function getVersionDir(jobId, version) {

  const dir = path.join(getJobDir(jobId), version);

  ensureDir(dir);

  return dir;

}

/* ---------- list versions ---------- */

function listVersions(jobId) {

  const dir = getJobDir(jobId);

  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter(v =>
      fs.statSync(path.join(dir, v)).isDirectory()
    );

}

/* ---------- list artifacts ---------- */

function listArtifacts(jobId) {

  const jobDir = getJobDir(jobId);

  if (!fs.existsSync(jobDir)) return [];

  const versions = listVersions(jobId);

  const result = [];

  for (const version of versions) {

    const versionDir = path.join(jobDir, version);

    const files = fs.readdirSync(versionDir);

    for (const file of files) {

      result.push({
        version,
        file,
        path: path.join(versionDir, file)
      });

    }

  }

  return result;

}

/* ---------- get artifact ---------- */

function getArtifact(jobId, file, version = null) {

  const jobDir = getJobDir(jobId);

  if (!fs.existsSync(jobDir)) return null;

  /* version 지정 */

  if (version) {

    const p = path.join(jobDir, version, file);

    if (fs.existsSync(p)) return p;

    return null;

  }

  /* 최신 버전 검색 */

  const versions = listVersions(jobId)
    .sort()
    .reverse();

  for (const v of versions) {

    const p = path.join(jobDir, v, file);

    if (fs.existsSync(p)) return p;

  }

  return null;

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
  listVersions,
  getArtifact,
  getJobDir,
  getVersionDir,
  deleteArtifact,
  deleteJobArtifacts
};