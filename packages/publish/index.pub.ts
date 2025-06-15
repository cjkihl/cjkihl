import { exec } from "node:child_process";
import node_fs from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import { findRoot } from "@cjkihl/find-root";
import * as semver from "semver";
import type { PackageJson } from "type-fest";

const execAsync = promisify(exec);

export interface PublishOptions {
	dryRun?: boolean;
	access?: "public" | "restricted";
	tag?: string;
}

const DEFAULT_OPTIONS: Required<PublishOptions> = {
	dryRun: false,
	access: "public",
	tag: "latest",
};

/**
 * Reads and parses package.json file
 */
function readPackageJson(pkgPath: string): PackageJson {
	console.log(`📂 Reading package.json from ${pkgPath}`);
	if (!node_fs.existsSync(pkgPath)) {
		throw new Error(`No package.json found at ${pkgPath}`);
	}
	try {
		const content = node_fs.readFileSync(pkgPath, "utf8");
		console.log("📄 Successfully read package.json");
		return JSON.parse(content);
	} catch (error) {
		console.error("❌ Failed to parse package.json");
		throw new Error(
			`Failed to parse package.json: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

/**
 * Get the latest version of a package from npm
 */
async function getLatestVersion(packageName: string): Promise<string> {
	console.log(`🔍 Checking latest version for ${packageName} on npm`);
	try {
		const { stdout } = await execAsync(`npm view ${packageName} version`);
		const version = stdout.trim();
		console.log(`📦 Found latest version: ${version}`);
		return version;
	} catch (error) {
		// If package doesn't exist on npm, return "0.0.0"
		if (error instanceof Error && error.message.includes("404")) {
			console.log(`📦 Package ${packageName} not found on npm`);
			return "0.0.0";
		}
		console.error(`❌ Failed to get latest version for ${packageName}`);
		throw new Error(
			`Failed to get latest version for ${packageName}: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

/**
 * Get the publish command based on package manager and options
 */
function getPublishCommand(
	packageManager: string,
	options: PublishOptions,
): string {
	console.log(`🔧 Using package manager: ${packageManager}`);
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

	const command =
		args.length > 0 ? `${baseCommand} ${args.join(" ")}` : baseCommand;
	console.log(`📝 Generated publish command: ${command}`);
	return command;
}

/**
 * Check if package can be published
 */
async function canPublish(packageJson: PackageJson): Promise<boolean> {
	console.log(`🔍 Checking if ${packageJson.name} can be published`);

	if (!packageJson.name || !packageJson.version) {
		console.error("❌ Package missing name or version");
		throw new Error("Package must have name and version");
	}

	// Skip private packages
	if (packageJson.private) {
		console.log(`⏭️  Skipping private package ${packageJson.name}`);
		return false;
	}

	// Get latest version from npm
	const latestVersion = await getLatestVersion(packageJson.name);
	const currentVersion = packageJson.version;

	// If package doesn't exist on npm, it can be published
	if (latestVersion === "0.0.0") {
		console.log(
			`🆕 Package ${packageJson.name} not found on npm, can be published`,
		);
		return true;
	}

	// Compare versions
	const canPublish = semver.gt(currentVersion, latestVersion);
	if (canPublish) {
		console.log(
			`📈 ${packageJson.name} can be published: ${latestVersion} -> ${currentVersion}`,
		);
	} else {
		console.log(`⏭️  ${packageJson.name} is up to date (${currentVersion})`);
	}

	return canPublish;
}

/**
 * Get the appropriate auth token based on package manager
 */
function getAuthToken(packageManager: string): string | undefined {
	switch (packageManager) {
		case "bun":
			return process.env.NPM_CONFIG_TOKEN || process.env.NPM_TOKEN;
		default:
			return process.env.NPM_TOKEN;
	}
}

/**
 * Check npm registry authentication
 */
async function checkNpmAuth(packageManager: string): Promise<void> {
	console.log("🔑 Checking npm registry authentication...");

	const authToken = getAuthToken(packageManager);
	if (!authToken) {
		console.error("❌ No authentication token found");
		console.error(
			`Please set ${packageManager === "bun" ? "NPM_CONFIG_TOKEN" : "NPM_TOKEN"} environment variable`,
		);
		throw new Error("No authentication token found");
	}

	try {
		const { stdout } = await execAsync("npm whoami");
		console.log(`✅ Authenticated as: ${stdout.trim()}`);
	} catch (error) {
		console.error("❌ Not authenticated with npm registry");
		console.error("Please run 'npm login' first");
		throw new Error("Not authenticated with npm registry");
	}
}

/**
 * Execute a command with proper output handling
 */
async function executeCommand(
	command: string,
	cwd: string,
): Promise<{ stdout: string; stderr: string }> {
	try {
		const { stdout, stderr } = await execAsync(command, {
			cwd,
			env: {
				...process.env,
				FORCE_COLOR: "1",
				CI: "true",
				NODE_ENV: "production",
			},
		});

		// Log output in real-time
		if (stdout) console.log(stdout);
		if (stderr) console.error(stderr);

		return { stdout, stderr };
	} catch (error) {
		const execError = error as { stdout?: string; stderr?: string };
		// Log any output that was captured before the error
		if (execError.stdout) console.log(execError.stdout);
		if (execError.stderr) console.error(execError.stderr);
		throw error;
	}
}

/**
 * Publish a package
 */
export async function publish(
	packagePath: string,
	userOptions: Partial<PublishOptions> = {},
): Promise<void> {
	console.log(`🚀 Starting publish process for ${packagePath}`);
	const options = { ...DEFAULT_OPTIONS, ...userOptions };

	try {
		// Get root package.json to determine package manager
		console.log("🔍 Finding project root");
		const root = await findRoot();

		// Check npm authentication first with the correct package manager
		await checkNpmAuth(root.packageManager);

		// Read package.json
		const packageJson = readPackageJson(join(packagePath, "package.json"));
		if (!packageJson.name) {
			console.error("❌ Package missing name");
			throw new Error("Package must have a name");
		}

		// Check if package can be published
		if (!(await canPublish(packageJson))) {
			console.log(`⏭️  Skipping publish for ${packageJson.name}`);
			return;
		}

		// Get publish command
		const publishCommand = getPublishCommand(root.packageManager, options);

		// Publish package
		console.log(`🚀 Publishing ${packageJson.name}...`);
		if (options.dryRun) {
			console.log("🔍 Dry run mode - no changes will be made");
		}

		console.log(`📝 Executing command: ${publishCommand}`);

		// Create a promise that rejects after 5 minutes
		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(
				() => {
					reject(
						new Error(`Command timed out after 5 minutes: ${publishCommand}`),
					);
				},
				5 * 60 * 1000,
			);
		});

		// Execute the command with timeout
		await Promise.race([
			executeCommand(publishCommand, packagePath),
			timeoutPromise,
		]);

		if (!options.dryRun) {
			console.log(
				`✅ Successfully published ${packageJson.name}@${packageJson.version}`,
			);
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(`❌ Failed to publish package: ${errorMessage}`);
		if (error instanceof Error && error.stack) {
			console.error("Stack trace:", error.stack);
		}
		throw error; // Re-throw to allow caller to handle the error
	}
}
