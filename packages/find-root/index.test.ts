import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	test,
} from "bun:test";
import { realpathSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, normalize } from "node:path";
import { findRoot, findRootSync } from "./index.pub.ts";

describe("findRoot", () => {
	let testDir: string;
	let nestedDir: string;
	let originalCwd: string;

	beforeAll(async () => {
		// Store original working directory
		originalCwd = process.cwd();

		// Create a temporary test directory with a unique name
		testDir = normalize(join(tmpdir(), `find-root-test-${Date.now()}`));
		nestedDir = join(testDir, "nested", "dir");
	});

	beforeEach(async () => {
		// Clean up and recreate test directory before each test
		await rm(testDir, { force: true, recursive: true });
		await mkdir(nestedDir, { recursive: true });
	});

	afterAll(async () => {
		// Clean up test directory
		await rm(testDir, { force: true, recursive: true });
		// Restore original working directory
		process.chdir(originalCwd);
	});

	function real(p: string) {
		return realpathSync(p);
	}

	test("should find root directory with bun.lockb", async () => {
		// Create a bun.lockb file in the root
		await writeFile(join(testDir, "bun.lockb"), "");

		// Change to nested directory
		process.chdir(nestedDir);

		const result = await findRoot();
		expect(real(result.root)).toBe(real(testDir));
		expect(real(result.lockfile)).toBe(real(join(testDir, "bun.lockb")));
		expect(result.packageManager).toBe("bun");
	});
});

describe("findRootSync", () => {
	let testDir: string;
	let nestedDir: string;
	let originalCwd: string;

	beforeAll(async () => {
		originalCwd = process.cwd();
		testDir = normalize(join(tmpdir(), `find-root-sync-test-${Date.now()}`));
		nestedDir = join(testDir, "nested", "dir");
	});

	beforeEach(async () => {
		await rm(testDir, { force: true, recursive: true });
		await mkdir(nestedDir, { recursive: true });
	});

	afterAll(async () => {
		await rm(testDir, { force: true, recursive: true });
		process.chdir(originalCwd);
	});

	function real(p: string) {
		return realpathSync(p);
	}

	test("should find root directory with bun.lock", async () => {
		await writeFile(join(testDir, "bun.lock"), "");
		process.chdir(nestedDir);

		const result = findRootSync();
		expect(real(result.root)).toBe(real(testDir));
		expect(real(result.lockfile)).toBe(real(join(testDir, "bun.lock")));
		expect(result.packageManager).toBe("bun");
	});

	test("should find root directory with package-lock.json", async () => {
		await writeFile(join(testDir, "package-lock.json"), "{}");
		process.chdir(nestedDir);

		const result = findRootSync();
		expect(real(result.root)).toBe(real(testDir));
		expect(result.packageManager).toBe("npm");
	});

	test("should match async findRoot result", async () => {
		await writeFile(join(testDir, "bun.lock"), "");
		process.chdir(nestedDir);

		const syncResult = findRootSync();
		const asyncResult = await findRoot();
		expect(syncResult.root).toBe(asyncResult.root);
		expect(syncResult.lockfile).toBe(asyncResult.lockfile);
		expect(syncResult.packageManager).toBe(asyncResult.packageManager);
	});
});
