const crypto = require("crypto")

const SECRET =
  process.env.ARTIFACT_SIGN_SECRET
  || "wraply-artifact-secret"


function sign(data) {

  return crypto
    .createHmac("sha256", SECRET)
    .update(data)
    .digest("hex")

}


function createSignedToken(payload) {

  const expires =
    Date.now() + (payload.ttl || 600000)

  const base = JSON.stringify({
    jobId: payload.jobId,
    file: payload.file,
    expires
  })

  const signature = sign(base)

  const token = Buffer
    .from(JSON.stringify({
      payload: base,
      sig: signature
    }))
    .toString("base64")

  return token

}


function verifySignedToken(token) {

  try {

    const decoded = JSON
      .parse(
        Buffer
          .from(token, "base64")
          .toString()
      )

    const expected =
      sign(decoded.payload)

    if (expected !== decoded.sig) {
      return null
    }

    const payload =
      JSON.parse(decoded.payload)

    if (Date.now() > payload.expires) {
      return null
    }

    return payload

  } catch (err) {

    return null

  }

}


module.exports = {
  createSignedToken,
  verifySignedToken
}