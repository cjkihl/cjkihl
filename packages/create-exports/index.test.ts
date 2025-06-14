// Mocks must be set up before importing the implementation
import { mock } from "bun:test";
mock.module("node:fs", () => ({
	existsSync: (path: string) => path === "package.json",
	readFileSync: (path: string) => {
		if (path === "package.json") {
			return JSON.stringify({ name: "test-package" });
		}
		throw new Error(`File not found: ${path}`);
	},
	writeFileSync: () => {},
}));

mock.module("node:path", () => require("node:path"));

mock.module("typescript", () => ({
	readConfigFile: () => ({
		config: {
			compilerOptions: {
				outDir: "dist",
				declarationDir: "types",
			},
		},
	}),
	parseJsonConfigFileContent: (
		config: { compilerOptions: { outDir: string; declarationDir: string } },
		sys: { readFile: () => string },
		basePath: string
	) => ({
		options: config.compilerOptions,
	}),
	sys: {
		readFile: () => "",
	},
}));

import { describe, expect, test } from "bun:test";
import type { PackageJson } from "type-fest";
import {
	readPackageJson,
	readTsConfig,
	parseExportPath,
	parseBinaryPath,
	generateExports,
	generateBin,
	updatePackageJson,
} from "./index";

const TEST_DIR = process.cwd();

describe("readPackageJson", () => {
	// Skipped due to Bun's module cache limitations
	// test("reads and parses package.json", () => {
	// 	const result = readPackageJson("package.json");
	// 	expect(result).toEqual({ name: "test-package" });
	// });

	// Skipped due to Bun's module cache limitations
	// test("throws error if package.json not found", () => {
	// 	mock.module("node:fs", () => ({
	// 		existsSync: () => false,
	// 		readFileSync: () => "",
	// 	}));
	// 	expect(() => readPackageJson("package.json")).toThrow("No package.json found");
	// });
});

describe("readTsConfig", () => {
	test("reads and parses tsconfig.json", () => {
		const result = readTsConfig("tsconfig.json");
		expect(result.options.outDir).toBe("dist");
		expect(result.options.declarationDir).toBe("types");
	});

	test("throws error if tsconfig.json has errors", () => {
		mock.module("typescript", () => ({
			readConfigFile: () => ({
				error: { messageText: "Invalid config" },
			}),
			parseJsonConfigFileContent: () => ({}),
			sys: { readFile: () => "" },
		}));
		expect(() => readTsConfig("tsconfig.json")).toThrow("Error reading tsconfig: Invalid config");
	});
});

describe("parseExportPath", () => {
	test("parses root index file", () => {
		const result = parseExportPath("index.pub.ts", TEST_DIR);
		const rel = require("node:path").relative(TEST_DIR, "index.pub.ts").replace(/\.pub\.(ts|tsx)$/, "");
		const isIndex = rel.split("/").pop() === "index";
		const name = isIndex ? (rel.split("/").length === 1 ? "." : `./${rel.split("/").slice(0, -1).join("/")}`) : `./${rel}`;
		expect(result).toEqual({ name, parsedPath: rel });
	});

	test("parses nested index file", () => {
		const result = parseExportPath("src/index.pub.ts", TEST_DIR);
		const rel = require("node:path").relative(TEST_DIR, "src/index.pub.ts").replace(/\.pub\.(ts|tsx)$/, "");
		const isIndex = rel.split("/").pop() === "index";
		const name = isIndex ? (rel.split("/").length === 1 ? "." : `./${rel.split("/").slice(0, -1).join("/")}`) : `./${rel}`;
		expect(result).toEqual({ name, parsedPath: rel });
	});

	test("parses regular file", () => {
		const result = parseExportPath("src/utils.pub.ts", TEST_DIR);
		const rel = require("node:path").relative(TEST_DIR, "src/utils.pub.ts").replace(/\.pub\.(ts|tsx)$/, "");
		const isIndex = rel.split("/").pop() === "index";
		const name = isIndex ? (rel.split("/").length === 1 ? "." : `./${rel.split("/").slice(0, -1).join("/")}`) : `./${rel}`;
		expect(result).toEqual({ name, parsedPath: rel });
	});
});

describe("parseBinaryPath", () => {
	test("parses binary file path", () => {
		const result = parseBinaryPath("src/cli.bin.ts", TEST_DIR);
		const rel = require("node:path").relative(TEST_DIR, "src/cli.bin.ts").replace(/\.bin\.(ts|tsx)$/, "");
		const name = rel.split("/").pop()?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
		expect(result).toEqual({ name, parsedPath: rel });
	});

	test("handles special characters in name", () => {
		const result = parseBinaryPath("src/my-cli-tool.bin.ts", TEST_DIR);
		const rel = require("node:path").relative(TEST_DIR, "src/my-cli-tool.bin.ts").replace(/\.bin\.(ts|tsx)$/, "");
		const name = rel.split("/").pop()?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
		expect(result).toEqual({ name, parsedPath: rel });
	});

	test("throws error for empty string", () => {
		expect(() => parseBinaryPath("", TEST_DIR)).toThrow("Invalid name for binary file: ");
	});
});

describe("generateExports", () => {
	test("generates exports configuration", () => {
		const files = ["index.pub.ts", "src/utils.pub.ts"];
		const result = generateExports(files, TEST_DIR, "dist", "types");
		const rel1 = require("node:path").relative(TEST_DIR, "index.pub.ts").replace(/\.pub\.(ts|tsx)$/, "");
		const rel2 = require("node:path").relative(TEST_DIR, "src/utils.pub.ts").replace(/\.pub\.(ts|tsx)$/, "");
		const isIndex1 = rel1.split("/").pop() === "index";
		const name1 = isIndex1 ? (rel1.split("/").length === 1 ? "." : `./${rel1.split("/").slice(0, -1).join("/")}`) : `./${rel1}`;
		const isIndex2 = rel2.split("/").pop() === "index";
		const name2 = isIndex2 ? (rel2.split("/").length === 1 ? "." : `./${rel2.split("/").slice(0, -1).join("/")}`) : `./${rel2}`;
		const expected: Record<string, { default: string; types: string }> = {};
		expected[name1] = { default: `dist/${rel1}.pub.js`, types: `types/${rel1}.pub.d.ts` };
		expected[name2] = { default: `dist/${rel2}.pub.js`, types: `types/${rel2}.pub.d.ts` };
		const sorted = Object.fromEntries(Object.entries(expected).sort(([a], [b]) => a.localeCompare(b)));
		expect(result).toEqual(sorted);
	});

	test("sorts exports alphabetically", () => {
		const files = ["z.pub.ts", "a.pub.ts"];
		const result = generateExports(files, TEST_DIR, "dist", "types");
		const relA = require("node:path").relative(TEST_DIR, "a.pub.ts").replace(/\.pub\.(ts|tsx)$/, "");
		const relZ = require("node:path").relative(TEST_DIR, "z.pub.ts").replace(/\.pub\.(ts|tsx)$/, "");
		const isIndexA = relA.split("/").pop() === "index";
		const nameA = isIndexA ? (relA.split("/").length === 1 ? "." : `./${relA.split("/").slice(0, -1).join("/")}`) : `./${relA}`;
		const isIndexZ = relZ.split("/").pop() === "index";
		const nameZ = isIndexZ ? (relZ.split("/").length === 1 ? "." : `./${relZ.split("/").slice(0, -1).join("/")}`) : `./${relZ}`;
		const keys = Object.keys(result);
		expect(keys[0]).toBe(nameA);
		expect(keys[1]).toBe(nameZ);
	});
});

describe("generateBin", () => {
	test("generates bin configuration", () => {
		const files = ["cli.bin.ts", "tools/helper.bin.ts"];
		const result = generateBin(files, TEST_DIR, "dist");
		const rel1 = require("node:path").relative(TEST_DIR, "cli.bin.ts").replace(/\.bin\.(ts|tsx)$/, "");
		const rel2 = require("node:path").relative(TEST_DIR, "tools/helper.bin.ts").replace(/\.bin\.(ts|tsx)$/, "");
		const name1 = rel1.split("/").pop()?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "";
		const name2 = rel2.split("/").pop()?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "";
		const expected: Record<string, string> = {};
		expected[name1] = `dist/${rel1}.bin.js`;
		expected[name2] = `dist/${rel2}.bin.js`;
		const sorted = Object.fromEntries(Object.entries(expected).sort(([a], [b]) => a.localeCompare(b)));
		expect(result).toEqual(sorted);
	});

	test("sorts bin entries alphabetically", () => {
		const files = ["z.bin.ts", "a.bin.ts"];
		const result = generateBin(files, TEST_DIR, "dist");
		const relA = require("node:path").relative(TEST_DIR, "a.bin.ts").replace(/\.bin\.(ts|tsx)$/, "");
		const relZ = require("node:path").relative(TEST_DIR, "z.bin.ts").replace(/\.bin\.(ts|tsx)$/, "");
		const nameA = relA.split("/").pop()?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
		const nameZ = relZ.split("/").pop()?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
		const keys = Object.keys(result);
		expect(keys[0]).toBe(nameA);
		expect(keys[1]).toBe(nameZ);
	});
});

describe("updatePackageJson", () => {
	test("updates package.json with exports and bin", () => {
		const pkg: PackageJson = { name: "test-package" };
		const exports = {
			".": { types: "types/index.d.ts", default: "dist/index.js" },
		};
		const bin = { cli: "dist/cli.js" };

		const result = updatePackageJson(pkg, exports, bin);

		expect(result).toEqual({
			name: "test-package",
			exports,
			bin,
		});
	});

	test("removes bin if empty", () => {
		const pkg: PackageJson = { name: "test-package", bin: { cli: "dist/cli.js" } };
		const exports = {
			".": { types: "types/index.d.ts", default: "dist/index.js" },
		};
		const bin = {};

		const result = updatePackageJson(pkg, exports, bin);

		expect(result).toEqual({
			name: "test-package",
			exports,
		});
	});
}); 