import { access, exists, readFile, writeFile } from "node:fs/promises";
import node_path from "node:path";
import path from "node:path";
import { findRoot } from "@cjkihl/find-root";
import dotenv, { type DotenvParseOutput } from "dotenv";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

/**
 * Configuration options for the setTurboEnv function
 */
export interface WithEnvConfig {
	/** Array of environment file paths to check in order of priority */
	envFile?: string[];
}

const defaultConfig: Required<WithEnvConfig> = {
	envFile: [".env.local", ".env"],
};

/**
 * Runs the appropriate install command based on the detected package manager
 * @throws {Error} If the package manager is not supported or if the install command fails
 */
async function runInstall(): Promise<void> {
	const { packageManager } = await findRoot();
	console.log(`📦 Detected package manager: ${packageManager}`);

	const command = (() => {
		switch (packageManager) {
			case "bun":
				return "bun install";
			case "yarn":
				return "yarn install";
			case "pnpm":
				return "pnpm install";
			case "npm":
				return "npm install";
			default:
				throw new Error(`Unsupported package manager: ${packageManager}`);
		}
	})();

	try {
		console.log(`🚀 Running ${command}...`);
		await execAsync(command);
		console.log("✅ Dependencies installed successfully");
	} catch (error) {
		console.error("❌ Failed to install dependencies:", error);
		throw new Error(
			`Failed to install dependencies: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

/**
 * Sets up Turborepo environment variables by reading from .env files and updating turbo.json
 *
 * This function:
 * 1. Reads environment variables from specified .env files
 * 2. Extracts unique environment variable keys
 * 3. Updates the turbo.json configuration with these keys in the globalEnv array
 * 4. Runs the appropriate package manager install command
 *
 * @param config - Configuration options for environment file paths
 * @throws {Error} If no environment variables are found or if turbo.json doesn't exist
 * @example
 * ```ts
 * await setTurboEnv({ envFile: ['.env.production', '.env'] });
 * ```
 */
export default async function setTurboEnv(config: WithEnvConfig) {
	const finalConfig = { ...defaultConfig, ...config };

	// Get environment variables from the specified files
	const envConfig = await getEnvs(finalConfig.envFile);

	if (!envConfig) {
		throw new Error(
			"No environment variables found in any of the specified env files",
		);
	}

	// Extract and sort unique environment variable keys
	const envKeys = [...new Set(Object.keys(envConfig))].sort();

	// Get project root and turbo.json path
	const { root } = await findRoot();
	const turboPath = path.join(root, "turbo.json");

	// Verify turbo.json exists
	try {
		await access(turboPath);
	} catch (err) {
		throw new Error(`turbo.json file not found at ${turboPath}`);
	}

	// Read and update turbo.json
	const turboFile = await readFile(turboPath, "utf-8");
	const turboConfig = JSON.parse(turboFile);

	// Update globalEnv with sorted environment keys
	turboConfig.globalEnv = envKeys;

	// Write back the updated configuration
	await writeFile(turboPath, JSON.stringify(turboConfig, null, 2));

	// Run install command to update dependencies
	await runInstall();
}

/**
 * Reads and parses environment variables from the first existing env file
 *
 * @param envFile - Array of environment file paths to check
 * @returns Parsed environment variables or null if no valid file found
 */
async function getEnvs(envFile: string[]): Promise<DotenvParseOutput | null> {
	const { root } = await findRoot();

	// Find the first existing env file
	let envPath: string | null = null;
	for (const env of envFile) {
		const fullPath = node_path.join(root, env);
		if (await exists(fullPath)) {
			envPath = fullPath;
			break;
		}
	}

	if (!envPath) {
		return null;
	}

	try {
		const content = await readFile(envPath, "utf-8");
		return content ? dotenv.parse(content) : null;
	} catch (error) {
		console.error(`Error reading env file at ${envPath}:`, error);
		return null;
	}
}
