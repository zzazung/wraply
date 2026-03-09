const db = require("@wraply/shared/db");

describe("DB Query Wrapper", () => {

  test("query works", async () => {

    const rows = await db.query("SELECT 1 AS value;");

    expect(rows[0].value).toBe(1);

  });

});