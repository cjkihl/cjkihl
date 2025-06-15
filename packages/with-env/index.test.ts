import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

describe("package.json exports", () => {
	it("should have correct relative paths in exports", () => {
		const __dirname = dirname(fileURLToPath(import.meta.url));
		const packageJsonPath = join(__dirname, "package.json");
		console.log("Reading package.json from:", packageJsonPath);
		
		const packageJson = JSON.parse(
			readFileSync(packageJsonPath, "utf-8"),
		);
		
		console.log("Package.json exports:", JSON.stringify(packageJson.exports, null, 2));
		console.log("Package.json bin:", JSON.stringify(packageJson.bin, null, 2));

		// Check exports paths
		expect(packageJson.exports["."].types).toBe("./.dist/types/index.pub.d.ts");
		expect(packageJson.exports["."].default).toBe(
			"./.dist/output/index.pub.js",
		);

		// Check bin path
		expect(packageJson.bin.index).toBe("./.dist/output/index.bin.js");
	});
});
