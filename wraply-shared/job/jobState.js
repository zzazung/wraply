const STATES = {
  QUEUED: "queued",
  PREPARING: "preparing",
  PATCHING: "patching",
  BUILDING: "building",
  SIGNING: "signing",
  UPLOADING: "uploading",
  FINISHED: "finished",
  FAILED: "failed"
}

function isTerminal(status) {
  return status === STATES.FINISHED || status === STATES.FAILED
}

module.exports = {
  STATES,
  isTerminal
}