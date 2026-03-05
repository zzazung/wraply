const fs = require("fs");
const path = require("path");

describe("Artifact Scan", () => {

  test("detect apk file", () => {

    const dir = path.join(__dirname, "tmp");

    fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(
      path.join(dir, "app-release.apk"),
      "test"
    );

    const files = fs.readdirSync(dir);

    const hasApk = files.some(f => f.endsWith(".apk"));

    expect(hasApk).toBe(true);

  });

});