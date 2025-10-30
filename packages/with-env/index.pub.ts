import { execa } from "execa";
import { getEnvs } from "./get-env-from-file.ts";

/**
 * Configuration for loading environment variables
 */
export interface LoadEnvConfig {
	/** Array of environment file paths to load in order (e.g., [".env.default", ".env.local"]) */
	envFile?: string[];
}

const defaultLoadEnvConfig: Required<LoadEnvConfig> = {
	envFile: [".env.default", ".env.local"],
};

/**
 * Loads environment variables from specified files and sets them in process.env
 *
 * @param config - Configuration object for loading environment variables
 * @returns Promise that resolves when environment variables are loaded
 *
 * @example
 * ```typescript
 * // Load from default files (.env.default, .env.local) - .env.local overrides .env.default
 * await loadEnv();
 *
 * // Load from custom files in order
 * await loadEnv({
 *   envFile: [".env.production", ".env.local"]
 * });
 *
 * // Load from single file
 * await loadEnv({
 *   envFile: [".env.staging"]
 * });
 * ```
 *
 * @throws {Error} If environment files cannot be read or parsed
 */
export async function loadEnv(config: LoadEnvConfig = {}): Promise<void> {
	const finalConfig = { ...defaultLoadEnvConfig, ...config };

	try {
		// Load environment variables from local files
		const env = await getEnvs(finalConfig.envFile);
		if (env && Object.keys(env).length > 0) {
			for (const [key, value] of Object.entries(env)) {
				if (key && value !== undefined && value !== null) {
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
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to load environment variables: ${errorMessage}`);
	}
}

/**
 * Configuration for spawning a child process
 */
export interface SpawnConfig {
	/** The command to execute */
	command?: string;
	/** Array of arguments to pass to the command */
	args?: string[];
}

const defaultSpawnConfig: Required<SpawnConfig> = {
	args: [],
	command: "",
};

/**
 * Spawns a child process with the specified command and arguments
 *
 * @param config - Configuration object for spawning the process
 * @returns Promise that resolves when the process completes
 *
 * @example
 * ```typescript
 * // Execute a simple command
 * await spawn({
 *   command: "npm",
 *   args: ["run", "build"]
 * });
 *
 * // Execute with shell command
 * await spawn({
 *   command: "echo",
 *   args: ["Hello", "World"]
 * });
 *
 * // Execute complex command
 * await spawn({
 *   command: "docker",
 *   args: ["run", "--rm", "-v", "./src:/app", "node:18", "npm", "test"]
 * });
 * ```
 *
 * @throws {Error} If no command is provided or if the command execution fails
 */
export async function spawn(config: SpawnConfig = {}): Promise<void> {
	const finalConfig = { ...defaultSpawnConfig, ...config };

	// Check for required command first
	const command = finalConfig.command;
	if (!command) {
		throw new Error("No command provided to execute");
	}

	console.log("Spawning process with arguments:", command, finalConfig.args);

	try {
		// Spawn the subprocess and capture the reference
		const subprocess = execa(command, finalConfig.args ?? [], {
			cleanup: true, // Kill child on parent exit
			env: process.env,
			shell: true,
			stdio: "inherit",
			windowsHide: true,
		});

		// Set up signal handlers to properly forward signals to the child process
		const signals: ReadonlyArray<NodeJS.Signals> = [
			"SIGINT",
			"SIGTERM",
			"SIGHUP",
		];

		const handleSignal = (signal: NodeJS.Signals) => {
			// Forward the signal to the child process
			if (subprocess.pid) {
				subprocess.kill(signal);
			}
		};

		// Register signal handlers
		for (const signal of signals) {
			process.on(signal, handleSignal);
		}

		// Wait for the subprocess to complete
		await subprocess;

		// Remove signal handlers after process completes
		for (const signal of signals) {
			process.off(signal, handleSignal);
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new Error(`Command failed: ${errorMessage}`);
	}
}
