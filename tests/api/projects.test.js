const request = require("supertest");
const jwt = require("../../wraply-api/lib/jwt");

const app = require("../../wraply-api/app");
const db = require("@wraply/shared/db");

describe("Projects API", () => {

  let token;
  let userId;

  beforeAll(async () => {

    userId = `test-user-${Date.now()}`;

    await db.query(
      `
      INSERT INTO users (id, email)
      VALUES (?, ?)
      `,
      [userId, "test@test.com"]
    );

    token = jwt.signToken(
      { userId }
    );

  });

  afterAll(async () => {

    await db.query(
      `DELETE FROM users WHERE id=?`,
      [userId]
    );

  });

  test("GET /projects", async () => {

    const res = await request(app)
  .get("/projects")
  .set("Authorization", `Bearer ${token}`);

console.log(res.body);

expect(res.statusCode).toBe(200);

  });

});