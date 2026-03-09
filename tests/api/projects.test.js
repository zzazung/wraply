const request = require("supertest");
const app = require("../../wraply-api/app");

describe("Projects API", () => {

  let token;

  beforeAll(() => {
    token = "test-token";
  });

  test("GET /api/user/projects", async () => {

    const res = await request(app)
      .get("/api/user/projects")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);

    expect(Array.isArray(res.body)).toBe(true);

  });

});