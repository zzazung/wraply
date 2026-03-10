process.env.NODE_ENV = "test";

process.env.DB_HOST = process.env.DB_HOST || "127.0.0.1";
process.env.DB_PORT = process.env.DB_PORT || "3306";
process.env.DB_USER = process.env.DB_USER || "root";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "000000";
process.env.DB_NAME = process.env.DB_NAME || "wraply_test";

process.env.REDIS_URL =
  process.env.REDIS_URL || "redis://127.0.0.1:6379";

process.env.JWT_SECRET =
  process.env.JWT_SECRET || "test_secret";

process.env.WORKER_TOKEN =
  process.env.WORKER_TOKEN || "test_worker_token";
