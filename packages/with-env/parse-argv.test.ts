import { describe, expect, test } from "bun:test";
import { parseArgv } from "./parse-argv.ts";

describe("parseArgv", () => {
	test("direct CLI, multiple args: bun run file.ts --limit=5", () => {
		const result = parseArgv(["bun", "run", "file.ts", "--limit=5"]);
		expect(result.command).toBe("bun");
		expect(result.args).toEqual(["run", "file.ts", "--limit=5"]);
		expect(result.envFile).toBeUndefined();
	});

	test("package script (same argv as bun run run -- --limit=5)", () => {
		const result = parseArgv(["bun", "run", "file.ts", "--limit=5"]);
		expect(result.command).toBe("bun");
		expect(result.args).toEqual(["run", "file.ts", "--limit=5"]);
	});

	test("no extra args: bun run file.ts", () => {
		const result = parseArgv(["bun", "run", "file.ts"]);
		expect(result.command).toBe("bun");
		expect(result.args).toEqual(["run", "file.ts"]);
	});

	test("with-env option before command: --env-file .env bun run file.ts --limit=5", () => {
		const result = parseArgv([
			"--env-file",
			".env",
			"bun",
			"run",
			"file.ts",
			"--limit=5",
		]);
		expect(result.envFile).toEqual([".env"]);
		expect(result.command).toBe("bun");
		expect(result.args).toEqual(["run", "file.ts", "--limit=5"]);
	});

	test("explicit separator: -- bun run file.ts --limit=5", () => {
		const result = parseArgv(["--", "bun", "run", "file.ts", "--limit=5"]);
		expect(result.command).toBe("bun");
		expect(result.args).toEqual(["run", "file.ts", "--limit=5"]);
	});

	test("quoted single command (one argv token)", () => {
		const result = parseArgv(["bun run file.ts --limit=5"]);
		expect(result.command).toBe("bun run file.ts --limit=5");
		expect(result.args).toEqual([]);
	});

	test("multiple --env-file", () => {
		const result = parseArgv([
			"--env-file",
			".env.a",
			"--env-file",
			".env.b",
			"bun",
			"run",
			"file.ts",
		]);
		expect(result.envFile).toEqual([".env.a", ".env.b"]);
		expect(result.command).toBe("bun");
		expect(result.args).toEqual(["run", "file.ts"]);
	});

	test("empty argv exits with usage", () => {
		const exit = process.exit;
		process.exit = ((code?: number) => {
			throw new Error(`exit:${code}`);
		}) as typeof process.exit;
		try {
			expect(() => parseArgv([])).toThrow("exit:1");
		} finally {
			process.exit = exit;
		}
	});

	test("only -- leaves no command and exits", () => {
		const exit = process.exit;
		process.exit = ((code?: number) => {
			throw new Error(`exit:${code}`);
		}) as typeof process.exit;
		try {
			expect(() => parseArgv(["--"])).toThrow("exit:1");
		} finally {
			process.exit = exit;
		}
	});
});
