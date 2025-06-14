import { describe, expect, it } from "bun:test";
import {
	calculateNewVersion,
	generateReleaseNotes,
	type Package,
} from "./index.pub";

describe("bump", () => {
	describe("calculateNewVersion", () => {
		it("should increment patch version", () => {
			expect(calculateNewVersion("1.0.0", "patch")).toBe("1.0.1");
		});

		it("should increment minor version", () => {
			expect(calculateNewVersion("1.0.0", "minor")).toBe("1.1.0");
		});

		it("should increment major version", () => {
			expect(calculateNewVersion("1.0.0", "major")).toBe("2.0.0");
		});

		it("should throw error for invalid version", () => {
			expect(() => calculateNewVersion("invalid", "patch")).toThrow();
		});
	});

	describe("generateReleaseNotes", () => {
		const mockPackages: Package[] = [
			{
				path: "/path/to/pkg1",
				contents: {
					name: "@org/pkg1",
					version: "1.0.0"
				}
			},
			{
				path: "/path/to/pkg2",
				contents: {
					name: "@org/pkg2",
					version: "1.0.0"
				}
			}
		];

		it("should generate release notes with correct format", () => {
			const notes = generateReleaseNotes("1.0.1", mockPackages, "patch");
			
			expect(notes).toContain("## Release v1.0.1");
			expect(notes).toContain("- @org/pkg1@1.0.1");
			expect(notes).toContain("- @org/pkg2@1.0.1");
			expect(notes).toContain("This release includes patch version updates to @org/pkg1, @org/pkg2");
		});

		it("should handle single package", () => {
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			const singlePackage: Package[] = [mockPackages[0]!];
			const notes = generateReleaseNotes("1.0.1", singlePackage, "patch");
			
			expect(notes).toContain("- @org/pkg1@1.0.1");
			expect(notes).toContain("This release includes patch version updates to @org/pkg1");
		});
	});
}); 