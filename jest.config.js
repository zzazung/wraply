module.exports = {

  testEnvironment: "node",

  testTimeout: 30000,

  roots: [
    "<rootDir>/tests"
  ],

  setupFilesAfterEnv: [
    "<rootDir>/tests/setup/testEnv.js"
  ],

  globalSetup: "<rootDir>/tests/setup/db.setup.js",

  globalTeardown: "<rootDir>/tests/setup/db.teardown.js",

  collectCoverageFrom: [
    "wraply-api/**/*.js",
    "wraply-worker/**/*.js",
    "wraply-scheduler/**/*.js",
    "wraply-shared/**/*.js"
  ],

  coverageDirectory: "coverage"

};