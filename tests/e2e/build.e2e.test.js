const request = require("supertest");

const API = "http://localhost:4000";

describe("Build E2E", () => {

  test("Create build job", async () => {

    const res = await request(API)
      .post("/user/projects/test/builds")
      .send({
        platform: "android"
      });

    expect(res.statusCode).toBe(200);

    expect(res.body.jobId).toBeDefined();

  });

});