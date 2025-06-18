import { access, readFile, stat, writeFile } from "node:fs/promises";
import node_path from "node:path";
import path from "node:path";
import { getPackages } from "@manypkg/get-packages";
import dotenv, { type DotenvParseOutput } from "dotenv";

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
	const { root } = await getPackages(process.cwd());
	const turboPath = path.join(root.dir, "turbo.json");

	// Verify turbo.json exists
	try {
		await access(turboPath);
	} catch (_err) {
		throw new Error(`turbo.json file not found at ${turboPath}`);
	}

	// Read and update turbo.json
	const turboFile = await readFile(turboPath, "utf-8");
	const turboConfig = JSON.parse(turboFile);

	// Update globalEnv with sorted environment keys
	turboConfig.globalEnv = envKeys;

	// Write back the updated configuration
	await writeFile(turboPath, JSON.stringify(turboConfig, null, 2));
}

/**
 * Reads and parses environment variables from the first existing env file
 *
 * @param envFile - Array of environment file paths to check
 * @returns Parsed environment variables or null if no valid file found
 */
async function getEnvs(envFile: string[]): Promise<DotenvParseOutput | null> {
	const { root } = await getPackages(process.cwd());

	// Find the first existing env file
	let envPath: string | null = null;
	for (const env of envFile) {
		const fullPath = node_path.join(root.dir, env);
		const stats = await stat(fullPath);
		if (stats.isFile()) {
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
