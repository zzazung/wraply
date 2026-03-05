module.exports = {

  testEnvironment: "node",

  testTimeout: 30000,

  globalSetup: "<rootDir>/tests/setup/db.setup.js",

  globalTeardown: "<rootDir>/tests/setup/db.teardown.js",

  roots: [
    "<rootDir>/tests"
  ],

  setupFiles: [
    "<rootDir>/tests/setup.js"
  ]
};