import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	mock,
	spyOn,
} from "bun:test";

import { main } from "./with-env.bin.ts";

const parseArgvModule = await import("./parse-argv.ts");
const indexPubModule = await import("./index.pub.ts");

describe("with-env CLI main", () => {
	const originalEnv = process.env;
	const originalExit = process.exit;
	const originalArgv = process.argv;
	let exitCalls: unknown[][] = [];

	beforeEach(() => {
		process.env = { ...originalEnv };
		process.argv = [...originalArgv];
		mock.restore();
		exitCalls = [];
		process.exit = ((code: unknown) => {
			exitCalls.push([code]);
		}) as never;
	});

	afterEach(() => {
		process.env = originalEnv;
		process.argv = originalArgv;
		process.exit = originalExit;
		mock.restore();
	});

	it("passes command and args from parseArgv to spawn", async () => {
		delete process.env.NODE_ENV;
		const { parseSpy, loadEnvSpy, spawnSpy } = makeMocks();

		parseSpy.mockReturnValue({
			args: ["hello", "world"],
			command: "echo",
		});

		await main();

		expect(loadEnvSpy).toHaveBeenCalledWith({});
		expect(spawnSpy).toHaveBeenCalledWith({
			args: ["hello", "world"],
			command: "echo",
		});
	});

	const makeMocks = () => {
		const parseSpy = spyOn(parseArgvModule, "parseArgv");
		const loadEnvSpy = spyOn(indexPubModule, "loadEnv").mockResolvedValue();
		const spawnSpy = spyOn(indexPubModule, "spawn").mockResolvedValue();

		return { loadEnvSpy, parseSpy, spawnSpy };
	};

	it("uses default env file behavior when NODE_ENV is unset", async () => {
		delete process.env.NODE_ENV;
		const { parseSpy, loadEnvSpy, spawnSpy } = makeMocks();

		parseSpy.mockReturnValue({
			args: [],
			command: "echo",
		});

		await main();

		expect(loadEnvSpy).toHaveBeenCalledWith({});
		expect(spawnSpy).toHaveBeenCalled();
	});

	it("uses default env file behavior when NODE_ENV is development", async () => {
		process.env.NODE_ENV = "development";
		const { parseSpy, loadEnvSpy, spawnSpy } = makeMocks();

		parseSpy.mockReturnValue({
			args: [],
			command: "echo",
		});

		await main();

		expect(loadEnvSpy).toHaveBeenCalledWith({});
		expect(spawnSpy).toHaveBeenCalled();
	});

	it("uses .env.test when NODE_ENV is test", async () => {
		process.env.NODE_ENV = "test";
		const { parseSpy, loadEnvSpy } = makeMocks();

		parseSpy.mockReturnValue({
			args: [],
			command: "echo",
		});

		await main();

		expect(loadEnvSpy).toHaveBeenCalledWith({ envFile: [".env.test"] });
	});

	it("uses .env.production when NODE_ENV is production", async () => {
		process.env.NODE_ENV = "production";
		const { parseSpy, loadEnvSpy } = makeMocks();

		parseSpy.mockReturnValue({
			args: [],
			command: "echo",
		});

		await main();

		expect(loadEnvSpy).toHaveBeenCalledWith({ envFile: [".env.production"] });
	});

	it("uses .env.staging when NODE_ENV is staging", async () => {
		process.env.NODE_ENV = "staging";
		const { parseSpy, loadEnvSpy } = makeMocks();

		parseSpy.mockReturnValue({
			args: [],
			command: "echo",
		});

		await main();

		expect(loadEnvSpy).toHaveBeenCalledWith({ envFile: [".env.staging"] });
	});

	it("exits with code 1 and logs when loadEnv throws", async () => {
		const { parseSpy, loadEnvSpy, spawnSpy } = makeMocks();

		parseSpy.mockReturnValue({
			args: [],
			command: "echo",
		});

		const error = new Error("load failed");
		loadEnvSpy.mockRejectedValue(error);
		const consoleErrorSpy = spyOn(console, "error").mockImplementation(
			() => {},
		);

		await main();

		expect(spawnSpy).not.toHaveBeenCalled();
		expect(consoleErrorSpy).toHaveBeenCalledWith("Error:", error.message);
		expect(exitCalls).toEqual([[1]]);
	});

	it("exits with code 1 and logs when spawn throws", async () => {
		const { parseSpy, loadEnvSpy, spawnSpy } = makeMocks();

		parseSpy.mockReturnValue({
			args: [],
			command: "echo",
		});

		loadEnvSpy.mockResolvedValue();
		const error = new Error("spawn failed");
		spawnSpy.mockRejectedValue(error);
		const consoleErrorSpy = spyOn(console, "error").mockImplementation(
			() => {},
		);

		await main();

		expect(consoleErrorSpy).toHaveBeenCalledWith("Error:", error.message);
		expect(exitCalls).toEqual([[1]]);
	});
});

import { test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";

const packageDir = join(import.meta.dir);
// After build, tests can run from dist/output/ where the bin is .js
const binTs = join(packageDir, "with-env.bin.ts");
const binJs = join(packageDir, "with-env.bin.js");
const binPath = existsSync(binTs) ? binTs : binJs;

describe("with-env bin (integration)", () => {
	test("forwards all args to subprocess: echo hello --limit=5", async () => {
		const proc = Bun.spawn({
			cmd: [process.execPath, binPath, "echo", "hello", "--limit=5"],
			cwd: packageDir,
			stderr: "pipe",
			stdout: "pipe",
		});
		const stdout = await new Response(proc.stdout).text();
		await proc.exited;
		expect(proc.exitCode).toBe(0);
		// Child (echo) prints to stdout
		expect(stdout).toContain("hello");
		expect(stdout).toContain("--limit=5");
	});

	test("package script style: bun run file.ts --limit=5 (all args passed through)", async () => {
		// Simulates: "run": "with-env bun run file.ts" then bun run run -- --limit=5
		const proc = Bun.spawn({
			cmd: [process.execPath, binPath, "echo", "run", "file.ts", "--limit=5"],
			cwd: packageDir,
			stderr: "pipe",
			stdout: "pipe",
		});
		const stdout = await new Response(proc.stdout).text();
		await proc.exited;
		expect(proc.exitCode).toBe(0);
		expect(stdout).toContain("run");
		expect(stdout).toContain("file.ts");
		expect(stdout).toContain("--limit=5");
	});

	test("explicit -- separator", async () => {
		const proc = Bun.spawn({
			cmd: [process.execPath, binPath, "--", "echo", "foo", "--limit=5"],
			cwd: packageDir,
			stderr: "pipe",
			stdout: "pipe",
		});
		const stdout = await new Response(proc.stdout).text();
		await proc.exited;
		expect(proc.exitCode).toBe(0);
		expect(stdout).toContain("foo");
		expect(stdout).toContain("--limit=5");
	});
});
