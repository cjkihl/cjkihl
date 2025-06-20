import { execa } from "execa";
import { fetchCoolifyEnvs } from "./fetch-coolify-env.js";

/**
 * Configuration options for the Coolify environment loader
 */
export interface WithCoolifyEnvConfig {
	/** The Coolify API endpoint URL (e.g., "https://coolify.example.com") */
	endpoint?: string;
	/** The Coolify application ID to fetch environment variables for */
	appId?: string;
	/** The Coolify API token for authentication */
	token?: string;
	/** The command to execute after loading environment variables */
	command?: string;
	/** Arguments to pass to the command */
	args?: string[];
}

/**
 * Default configuration values
 * Uses environment variables as fallbacks for Coolify credentials
 */
const defaultConfig: Required<WithCoolifyEnvConfig> = {
	appId: process.env.COOLIFY_APP_ID || "",
	args: [],
	command: "",
	endpoint: process.env.COOLIFY_ENDPOINT || "",
	token: process.env.COOLIFY_TOKEN || "",
};

/**
 * Loads environment variables from Coolify and executes a command with those variables
 *
 * This function fetches environment variables from a Coolify instance using the provided
 * credentials, loads them into the current process environment, and then spawns a child
 * process with the specified command and arguments.
 *
 * @param config - Configuration options for loading environment variables and executing the command
 * @returns A promise that resolves when the child process exits successfully, or rejects with an error
 *
 * @example
 * ```typescript
 * // Basic usage with environment variables
 * await loadEnv({
 *   command: "npm",
 *   args: ["start"]
 * });
 *
 * // Explicit configuration
 * await loadEnv({
 *   endpoint: "https://coolify.example.com",
 *   appId: "my-app-id",
 *   token: "my-token",
 *   command: "node",
 *   args: ["server.js"]
 * });
 * ```
 *
 * @throws {Error} When no command is provided
 * @throws {Error} When the child process fails to execute or exits with a non-zero code
 * @throws {Error} When Coolify API requests fail
 */
export async function loadEnv(
	config: WithCoolifyEnvConfig = {},
): Promise<void> {
	const finalConfig = { ...defaultConfig, ...config };

	// Check for required command first
	const command = finalConfig.command;
	if (!command) {
		throw new Error("No command provided to execute");
	}

	// Load environment variables from Coolify
	if (!finalConfig.endpoint) {
		console.log(
			"No Coolify endpoint configured, proceeding without additional environment variables",
		);
	} else {
		try {
			const envs = await fetchCoolifyEnvs(
				finalConfig.endpoint,
				finalConfig.appId,
				finalConfig.token,
			);

			// Load environment variables into the current process
			for (const env of envs) {
				if (env.key && env.value) {
					process.env[env.key] = env.value;
				}
			}
			console.log(
				`Successfully loaded ${envs.length} environment variables from Coolify`,
			);
		} catch (error) {
			console.log(
				`Failed to load environment variables from Coolify: ${error instanceof Error ? error.message : String(error)}`,
			);
			console.log("Proceeding without Coolify environment variables");
		}
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
