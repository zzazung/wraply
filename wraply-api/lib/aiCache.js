// wraply-api/lib/aiCache.js

const crypto = require("crypto");
const redis = require("@wraply/shared/redis");

function hash(payload){
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

async function getCache(key){
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

async function setCache(key, value, ttl = 3600){
  await redis.set(key, JSON.stringify(value), "EX", ttl);
}

module.exports = {
  hash,
  getCache,
  setCache
};