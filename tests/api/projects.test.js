const request = require("supertest");
const app = require("../../wraply-api/server");

const { signToken } = require("../../wraply-api/lib/jwt");

describe("Projects API", () => {

  const token = signToken({
    userId: 1,
    email: "test@test.com",
    role: "user"
  });

  test("list projects", async () => {

    const res = await request(app)
      .get("/user/projects")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);

  });

});