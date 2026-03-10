module.exports = {

  testEnvironment: "node",

  testTimeout: 30000,

  detectOpenHandles: true,

  forceExit: true,

  roots: [
    "<rootDir>/tests"
  ],

  setupFiles: [
    "<rootDir>/tests/setup/testEnv.js"
  ],

  setupFilesAfterEnv: [
    "<rootDir>/tests/setup/jest.setup.js"
  ],

  moduleNameMapper: {
    "^@wraply/shared/(.*)$": "<rootDir>/wraply-shared/$1",
    "^@wraply/api/(.*)$": "<rootDir>/wraply-api/$1",
    "^@wraply/worker/(.*)$": "<rootDir>/wraply-worker/$1",
    "^@wraply/scheduler/(.*)$": "<rootDir>/wraply-scheduler/$1"
  },

  globalSetup: "<rootDir>/tests/setup/db.setup.js",

  globalTeardown: "<rootDir>/tests/setup/db.teardown.js",

  collectCoverageFrom: [
    "wraply-api/**/*.js",
    "wraply-worker/**/*.js",
    "wraply-scheduler/**/*.js",
    "wraply-shared/**/*.js"
  ],

  coverageDirectory: "coverage",

  maxWorkers: 1

};