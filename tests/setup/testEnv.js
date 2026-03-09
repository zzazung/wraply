process.env.NODE_ENV = "test";

process.env.JWT_SECRET = "test-secret";

process.env.DB_HOST = "localhost";
process.env.DB_PORT = "3306";
process.env.DB_USER = "root";
process.env.DB_PASSWORD = "000000";
process.env.DB_NAME = "wraply_test";

process.env.REDIS_URL = "redis://127.0.0.1:6379";

process.env.WRAPLY_BUILD_ROOT = "/tmp/wraply-test-builds";

/*
globalSetup에서는 jest가 존재하지 않음
*/
if (typeof jest !== "undefined") {
  jest.setTimeout(30000);
}