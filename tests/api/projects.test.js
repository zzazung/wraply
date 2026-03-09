const request = require("supertest");

const app = require("../../wraply-api/server");

const { createTestToken } = require("../helpers/auth");

describe("Projects API", () => {

  const token = createTestToken();

  test("GET /user/projects", async () => {

    const res = await request(app)
      .get("/user/projects")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);

    expect(Array.isArray(res.body)).toBe(true);

  });

});