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


/**
 * terminal 상태
 */
function isTerminal(status) {

  return (
    status === STATES.FINISHED ||
    status === STATES.FAILED
  )

}


/**
 * 상태 전이 정의
 */
const TRANSITIONS = {

  queued: [
    STATES.PREPARING,
    STATES.FAILED
  ],

  preparing: [
    STATES.PATCHING,
    STATES.FAILED
  ],

  patching: [
    STATES.BUILDING,
    STATES.FAILED
  ],

  building: [
    STATES.SIGNING,
    STATES.FAILED
  ],

  signing: [
    STATES.UPLOADING,
    STATES.FAILED
  ],

  uploading: [
    STATES.FINISHED,
    STATES.FAILED
  ],

  finished: [],

  failed: []

}


/**
 * 상태 전이 검증
 */
function isValidTransition(
  current,
  next
) {

  if (!current || !next)
    return false

  const allowed =
    TRANSITIONS[current]

  if (!allowed)
    return false

  return allowed.includes(next)

}


/**
 * progress 계산
 */
function getProgress(status) {

  switch (status) {

    case STATES.QUEUED:
      return 0

    case STATES.PREPARING:
      return 10

    case STATES.PATCHING:
      return 25

    case STATES.BUILDING:
      return 50

    case STATES.SIGNING:
      return 70

    case STATES.UPLOADING:
      return 90

    case STATES.FINISHED:
      return 100

    case STATES.FAILED:
      return 100

    default:
      return 0

  }

}


module.exports = {
  STATES,
  isTerminal,
  isValidTransition,
  getProgress
}