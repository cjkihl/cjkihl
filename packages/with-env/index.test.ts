import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("package.json exports", () => {
  it("should have correct relative paths in exports", () => {
    const packageJson = JSON.parse(
      readFileSync(join(import.meta.dir, "package.json"), "utf-8")
    );

    // Check exports paths
    expect(packageJson.exports["."].types).toBe("./.dist/types/index.pub.d.ts");
    expect(packageJson.exports["."].default).toBe("./.dist/output/index.pub.js");

    // Check bin path
    expect(packageJson.bin.index).toBe("./.dist/output/index.bin.js");
  });
});
