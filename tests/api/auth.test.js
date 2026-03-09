const jwt = require("jsonwebtoken");

describe("JWT Auth", () => {

  test("generate token", () => {

    const token = jwt.sign(
      { userId: 1 },
      process.env.JWT_SECRET
    );

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    expect(decoded.userId).toBe(1);

  });

});