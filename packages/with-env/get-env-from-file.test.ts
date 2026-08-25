import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	test,
} from "bun:test";
import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, normalize } from "node:path";
import { getEnvs, getEnvsSync } from "./get-env-from-file.ts";

describe("getEnvs / getEnvsSync", () => {
	let testDir: string;

	beforeAll(async () => {
		// Unique dir per suite invocation — tests run hermetically via explicit
		// `root` option, so no process.chdir (safe against parallel test files,
		// including compiled dist copies of this same file).
		testDir = normalize(join(tmpdir(), `with-env-test-${randomUUID()}`));
	});

	beforeEach(async () => {
		await rm(testDir, { force: true, recursive: true });
		await mkdir(testDir, { recursive: true });
	});

	afterAll(async () => {
		await rm(testDir, { force: true, recursive: true });
	});

	test("returns null when no env files exist", () => {
		expect(getEnvsSync([".env.local"], { root: testDir })).toBeNull();
	});

	test("returns null for empty envFileNames", () => {
		expect(getEnvsSync([], { root: testDir })).toBeNull();
		expect(getEnvsSync(undefined, { root: testDir })).toBeNull();
	});

	test("parses a single file", async () => {
		await writeFile(join(testDir, ".env.local"), "FOO=bar\nBAZ=qux\n");

		expect(getEnvsSync([".env.local"], { root: testDir })).toEqual({
			BAZ: "qux",
			FOO: "bar",
		});
	});

	test("later files override earlier ones", async () => {
		await writeFile(join(testDir, ".env"), "SHARED=base\nONLY_BASE=1\n");
		await writeFile(join(testDir, ".env.local"), "SHARED=local\n");

		const result = getEnvsSync([".env", ".env.local"], { root: testDir });
		expect(result).toEqual({ ONLY_BASE: "1", SHARED: "local" });
	});

	test("strips quotes and handles comments (dotenv semantics)", async () => {
		await writeFile(
			join(testDir, ".env.local"),
			'QUOTED="hello world"\n# comment\nESCAPED="line1\\nline2"\n',
		);

		expect(getEnvsSync([".env.local"], { root: testDir })).toEqual({
			ESCAPED: "line1\nline2",
			QUOTED: "hello world",
		});
	});

	test("async getEnvs matches getEnvsSync", async () => {
		await writeFile(join(testDir, ".env.local"), "FOO=bar\n");

		const syncResult = getEnvsSync([".env.local"], { root: testDir });
		const asyncResult = await getEnvs([".env.local"], { root: testDir });
		expect(asyncResult).toEqual(syncResult);
	});

	test("missing files in the list are skipped", async () => {
		await writeFile(join(testDir, ".env.local"), "FOO=bar\n");

		const result = getEnvsSync([".env", ".env.local"], { root: testDir });
		expect(result).toEqual({ FOO: "bar" });
	});
});
