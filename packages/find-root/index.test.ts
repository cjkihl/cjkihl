import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { findRoot } from "./index";
import { mkdir, writeFile, rm, unlink } from "node:fs/promises";
import { join, normalize } from "node:path";
import { tmpdir } from "node:os";
import { realpathSync } from "node:fs";

describe("findRoot", () => {
  let testDir: string;
  let nestedDir: string;
  let originalCwd: string;

  beforeAll(async () => {
    // Store original working directory
    originalCwd = process.cwd();
    
    // Create a temporary test directory
    testDir = normalize(join(tmpdir(), "find-root-test"));
    nestedDir = join(testDir, "nested", "dir");
    
    // Clean up any existing test directory
    await rm(testDir, { recursive: true, force: true });
    
    // Create fresh test directory
    await mkdir(nestedDir, { recursive: true });
  });

  afterAll(async () => {
    // Clean up test directory
    await rm(testDir, { recursive: true, force: true });
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

  test("should find root directory with pnpm-lock.yaml", async () => {
    // Remove bun.lockb if it exists
    try { await unlink(join(testDir, "bun.lockb")); } catch {}
    // Create a pnpm-lock.yaml file in the root
    await writeFile(join(testDir, "pnpm-lock.yaml"), "");
    
    // Change to nested directory
    process.chdir(nestedDir);

    const result = await findRoot();
    expect(real(result.root)).toBe(real(testDir));
    expect(real(result.lockfile)).toBe(real(join(testDir, "pnpm-lock.yaml")));
    expect(result.packageManager).toBe("pnpm");
  });

  test("should throw error when no lockfile is found", async () => {
    // Remove pnpm-lock.yaml if it exists
    try { await unlink(join(testDir, "pnpm-lock.yaml")); } catch {}
    // Change to a directory with no lockfile
    process.chdir(tmpdir());

    await expect(findRoot()).rejects.toThrow("Could not find root directory");
  });
}); 