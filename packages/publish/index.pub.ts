import { join } from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { findRoot } from "@cjkihl/find-root";
import type { PackageJson } from "type-fest";
import node_fs from "node:fs";
import * as semver from "semver";

const execAsync = promisify(exec);

export interface PublishOptions {
  retries?: number;
  retryDelay?: number;
  dryRun?: boolean;
  access?: "public" | "restricted";
  tag?: string;
}

const DEFAULT_OPTIONS: Required<PublishOptions> = {
  retries: 3,
  retryDelay: 1000,
  dryRun: false,
  access: "public",
  tag: "latest",
};

/**
 * Retry a function with exponential backoff
 */
async function retry<T>(
  fn: () => Promise<T>,
  retries: number,
  delay: number
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 2);
  }
}

/**
 * Reads and parses package.json file
 */
function readPackageJson(pkgPath: string): PackageJson {
  if (!node_fs.existsSync(pkgPath)) {
    throw new Error(`No package.json found at ${pkgPath}`);
  }
  try {
    return JSON.parse(node_fs.readFileSync(pkgPath, "utf8"));
  } catch (error) {
    throw new Error(`Failed to parse package.json: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get the latest version of a package from npm
 */
async function getLatestVersion(packageName: string, options: PublishOptions): Promise<string> {
  try {
    const { stdout } = await retry(
      () => execAsync(`npm view ${packageName} version`),
      options.retries ?? DEFAULT_OPTIONS.retries,
      options.retryDelay ?? DEFAULT_OPTIONS.retryDelay
    );
    return stdout.trim();
  } catch (error) {
    // If package doesn't exist on npm, return "0.0.0"
    if (error instanceof Error && error.message.includes("404")) {
      return "0.0.0";
    }
    throw new Error(`Failed to get latest version for ${packageName}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get the publish command based on package manager and options
 */
function getPublishCommand(packageManager: string, options: PublishOptions): string {
  const baseCommand = (() => {
    switch (packageManager) {
      case "bun":
        return "bun publish";
      case "yarn":
        return "yarn publish";
      case "pnpm":
        return "pnpm publish";
      case "npm":
        return "npm publish";
      default:
        throw new Error(`Unsupported package manager: ${packageManager}`);
    }
  })();

  const args: string[] = [];

  if (options.dryRun) {
    args.push("--dry-run");
  }

  if (options.access) {
    args.push(`--access=${options.access}`);
  }

  if (options.tag) {
    args.push(`--tag=${options.tag}`);
  }

  return args.length > 0 ? `${baseCommand} ${args.join(" ")}` : baseCommand;
}

/**
 * Check if package can be published
 */
async function canPublish(packageJson: PackageJson, options: PublishOptions): Promise<boolean> {
  if (!packageJson.name || !packageJson.version) {
    throw new Error("Package must have name and version");
  }

  // Skip private packages
  if (packageJson.private) {
    console.log(`⏭️  Skipping private package ${packageJson.name}`);
    return false;
  }

  // Get latest version from npm
  const latestVersion = await getLatestVersion(packageJson.name, options);
  const currentVersion = packageJson.version;

  // If package doesn't exist on npm, it can be published
  if (latestVersion === "0.0.0") {
    console.log(`🆕 Package ${packageJson.name} not found on npm, can be published`);
    return true;
  }

  // Compare versions
  const canPublish = semver.gt(currentVersion, latestVersion);
  if (canPublish) {
    console.log(`📈 ${packageJson.name} can be published: ${latestVersion} -> ${currentVersion}`);
  } else {
    console.log(`⏭️  ${packageJson.name} is up to date (${currentVersion})`);
  }

  return canPublish;
}

/**
 * Publish a package
 */
export async function publish(packagePath: string, userOptions: Partial<PublishOptions> = {}): Promise<void> {
  const options = { ...DEFAULT_OPTIONS, ...userOptions };

  try {
    // Read package.json
    const packageJson = readPackageJson(join(packagePath, "package.json"));
    if (!packageJson.name) {
      throw new Error("Package must have a name");
    }

    // Check if package can be published
    if (!(await canPublish(packageJson, options))) {
      return;
    }

    // Get root package.json to determine package manager
    const root = await findRoot();
    const publishCommand = getPublishCommand(root.packageManager, options);

    // Publish package
    console.log(`🚀 Publishing ${packageJson.name}...`);
    if (options.dryRun) {
      console.log("🔍 Dry run mode - no changes will be made");
    }

    await retry(
      () => execAsync(publishCommand, { cwd: packagePath }),
      options.retries ?? DEFAULT_OPTIONS.retries,
      options.retryDelay ?? DEFAULT_OPTIONS.retryDelay
    );

    if (!options.dryRun) {
      console.log(`✅ Successfully published ${packageJson.name}@${packageJson.version}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed to publish package: ${errorMessage}`);
    throw error; // Re-throw to allow caller to handle the error
  }
} 