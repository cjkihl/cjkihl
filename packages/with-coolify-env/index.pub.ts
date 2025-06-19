import { type ChildProcess, spawn } from "node:child_process";
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
	/** Whether to skip loading environment variables in production (default: true) */
	skipInProduction?: boolean;
	/** Whether to inherit stdio from the parent process (default: true) */
	inheritStdio?: boolean;
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
	inheritStdio: true,
	skipInProduction: true,
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
 *
 * // Skip production check
 * await loadEnv({
 *   skipInProduction: false,
 *   command: "npm",
 *   args: ["run", "build"]
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

	// Skip loading environment variables in production if configured to do so
	if (finalConfig.skipInProduction && process.env.NODE_ENV === "production") {
		console.log(
			"Skipping loading env file because the process is running in the Prod environment",
		);
	} else {
		// Fetch and load environment variables from Coolify
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
	}

	console.log("Spawning process with arguments:", command, finalConfig.args);

	return new Promise<void>((resolve, reject) => {
		let stderrOutput = "";

		// Spawn the child process with the loaded environment variables
		const proc: ChildProcess = spawn(command, finalConfig.args ?? [], {
			env: process.env,
			shell: true,
			stdio: finalConfig.inheritStdio ? "inherit" : "pipe",
		});

		// Capture stderr output if not inheriting stdio
		if (!finalConfig.inheritStdio) {
			proc.stderr?.on("data", (data) => {
				stderrOutput += data.toString();
			});
		}

		// Handle process exit
		proc.on("exit", (code: number | null) => {
			if (code === 0) {
				resolve();
			} else {
				const errorMessage = [
					`Command failed with exit code ${code}`,
					`Command: ${command} ${finalConfig.args?.join(" ") || ""}`,
					stderrOutput
						? `Error output:\n${stderrOutput}`
						: "No error output available",
				].join("\n");
				reject(new Error(errorMessage));
			}
		});

		// Handle process errors
		proc.on("error", (err: Error) => {
			const errorMessage = [
				`Failed to execute command: ${err.message}`,
				`Command: ${command} ${finalConfig.args?.join(" ") || ""}`,
				stderrOutput
					? `Error output:\n${stderrOutput}`
					: "No error output available",
			].join("\n");
			reject(new Error(errorMessage));
		});
	});
}
