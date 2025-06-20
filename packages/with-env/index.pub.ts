import { execa } from "execa";
import { getEnvs } from "./get-env-from-file.js";

export interface WithEnvConfig {
	envFile?: string[];
	command?: string;
	args?: string[];
}

const defaultConfig: Required<WithEnvConfig> = {
	args: [],
	command: "",
	envFile: [".env.local", ".env"],
};

/**
 * Loads environment variables from local env files and executes a command with those variables
 *
 * This function loads environment variables from the first available env file in the specified list,
 * loads them into the current process environment, and then spawns a child process with the
 * specified command and arguments.
 *
 * @param config - Configuration options for loading environment variables and executing the command
 * @returns A promise that resolves when the child process exits successfully, or rejects with an error
 *
 * @example
 * ```typescript
 * // Basic usage with default env files
 * await loadEnv({
 *   command: "npm",
 *   args: ["start"]
 * });
 *
 * // Custom env files
 * await loadEnv({
 *   envFile: [".env.production", ".env"],
 *   command: "node",
 *   args: ["server.js"]
 * });
 * ```
 *
 * @throws {Error} When no command is provided
 * @throws {Error} When the child process fails to execute or exits with a non-zero code
 * @throws {Error} When env file reading fails
 */
export async function loadEnv(config: WithEnvConfig = {}): Promise<void> {
	const finalConfig = { ...defaultConfig, ...config };

	// Check for required command first
	const command = finalConfig.command;
	if (!command) {
		throw new Error("No command provided to execute");
	}

	// Load environment variables from local files
	const env = await getEnvs(finalConfig.envFile);
	if (env) {
		for (const [key, value] of Object.entries(env)) {
			if (key && value) {
				process.env[key] = value;
			}
		}
		console.log(
			`Successfully loaded ${Object.keys(env).length} environment variables from local files`,
		);
	} else {
		console.log(
			"No env file found, proceeding without additional environment variables",
		);
	}

	console.log("Spawning process with arguments:", command, finalConfig.args);

	try {
		await execa(command, finalConfig.args ?? [], {
			env: process.env,
			shell: true,
			stdio: "inherit",
			windowsHide: true,
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new Error(`Command failed: ${errorMessage}`);
	}
}
