import { describe, expect, test } from "bun:test";
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
