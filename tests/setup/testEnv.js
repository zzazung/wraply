process.env.NODE_ENV = "test";

/**
 * Database
 */
process.env.DB_HOST = "127.0.0.1";
process.env.DB_PORT = "3306";
process.env.DB_USER = "root";
process.env.DB_PASSWORD = "000000";
process.env.DB_NAME = "wraply_test";

/**
 * Redis
 */
process.env.REDIS_URL = "redis://127.0.0.1:6379";

/**
 * Auth
 */
process.env.JWT_SECRET = "test_secret";
process.env.WORKER_TOKEN = "test_worker_token";