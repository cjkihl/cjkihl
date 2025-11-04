import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { findRoot } from "@cjkihl/find-root";

import dotenv from "dotenv";

/**
 * Configuration options for the setTurboEnv function
 */
export interface TurboEnvConfig {
	/** Array of environment file paths to check in order of priority */
	envFile?: string[];
}

const defaultConfig: Required<TurboEnvConfig> = {
	envFile: [".env.local", ".env"],
};

/**
 * Sets up Turborepo environment variables by reading from .env files and updating turbo.json
 *
 * This function:
 * 1. Reads environment variables from specified .env files
 * 2. Extracts unique environment variable keys
 * 3. Updates the turbo.json configuration with these keys in the globalEnv array
 *
 * @param config - Configuration options for environment file paths
 * @throws {Error} If no environment variables are found or if turbo.json doesn't exist or is malformed
 * @example
 * ```ts
 * await setTurboEnv({ envFile: ['.env.production', '.env'] });
 * ```
 */
export default async function setTurboEnv(config: TurboEnvConfig) {
	const finalConfig = { ...defaultConfig, ...config };

	// Get project root first
	const { root } = await findRoot();

	// Extract unique environment variable keys from all env files
	const envKeys = await getEnvKeys(finalConfig.envFile, root);

	if (envKeys.size === 0) {
		throw new Error(
			"No environment variables found in any of the specified env files",
		);
	}

	// Get turbo.json path
	const turboPath = path.join(root, "turbo.json");

	// Read and update turbo.json
	let turboConfig: Record<string, unknown>;
	try {
		const turboFile = await readFile(turboPath, "utf-8");
		turboConfig = JSON.parse(turboFile);
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") {
			throw new Error(`turbo.json file not found at ${turboPath}`);
		}
		if (error instanceof SyntaxError) {
			throw new Error(
				`Failed to parse turbo.json: ${error.message}. The file may be malformed.`,
			);
		}
		throw new Error(
			`Failed to read turbo.json: ${error instanceof Error ? error.message : String(error)}`,
		);
	}

	// Update globalEnv with sorted environment keys
	turboConfig.globalEnv = [...envKeys].sort();

	// Write back the updated configuration
	await writeFile(turboPath, JSON.stringify(turboConfig, null, 2));
}

/**
 * Extracts unique environment variable keys from all existing env files.
 * Since we only need keys (not values), we can collect them from all files without merging.
 *
 * @param envFiles - Array of environment file paths to check
 * @param root - Root directory path to resolve env file paths from
 * @returns Set of unique environment variable keys from all found files
 */
async function getEnvKeys(
	envFiles: string[],
	root: string,
): Promise<Set<string>> {
	const envKeys = new Set<string>();

	// Process all env files and collect unique keys
	for (const envFile of envFiles) {
		const fullPath = path.join(root, envFile);
		try {
			const content = await readFile(fullPath, "utf-8");
			if (content.trim()) {
				const fileEnv = dotenv.parse(content);
				// Add all keys from this file to the set
				for (const key of Object.keys(fileEnv)) {
					envKeys.add(key);
				}
			}
		} catch {
			// File doesn't exist or error reading, continue to next
		}
	}

	return envKeys;
}
