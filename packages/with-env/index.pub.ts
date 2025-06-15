import { type ChildProcess, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import node_path from "node:path";
import { findRoot } from "@cjkihl/find-root";
import dotenv, { type DotenvParseOutput } from "dotenv";

export interface WithEnvConfig {
	envFile?: string[];
	skipInProduction?: boolean;
	inheritStdio?: boolean;
	command?: string;
	args?: string[];
}

const defaultConfig: Required<WithEnvConfig> = {
	envFile: [".env.local", ".env"],
	skipInProduction: true,
	inheritStdio: true,
	command: "",
	args: [],
};

/**
 * This script loads environment variables from .env.local
 *
 * @example node with-env
 */
export async function loadEnv(config: WithEnvConfig = {}) {
	const finalConfig = { ...defaultConfig, ...config };
	const envFileName = finalConfig.envFile ?? defaultConfig.envFile;

	if (finalConfig.skipInProduction && process.env.NODE_ENV === "production") {
		console.log(
			"Skipping loading env file because the process is running in the Prod environment",
		);
	} else {
		const env = await getEnvs(envFileName);
		if (env) {
			for (const [key, value] of Object.entries(env)) {
				if (key && value) {
					// console.log(`Set Env: ${key}`);
					process.env[key] = value;
				}
			}
		} else {
			console.log("No env file found");
		}
	}

	const command = finalConfig.command;
	if (!command) {
		throw new Error("No command provided to execute");
	}

	console.log("Spawning process with arguments:", command, finalConfig.args);

	return new Promise<void>((resolve, reject) => {
		let stderrOutput = "";
		const proc: ChildProcess = spawn(command, finalConfig.args ?? [], {
			env: process.env,
			stdio: finalConfig.inheritStdio ? "inherit" : "pipe",
			shell: true,
		});

		if (!finalConfig.inheritStdio) {
			proc.stderr?.on("data", (data) => {
				stderrOutput += data.toString();
			});
		}

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

async function getEnvs(envFile: string[]): Promise<DotenvParseOutput | null> {
	const { root } = await findRoot();

	let envPath: string | null = null;
	for (const env of envFile) {
		if (existsSync(node_path.join(root, env))) {
			envPath = node_path.join(root, env);
			break;
		}
	}

	if (!envPath) {
		return null;
	}

	try {
		const content = await readFile(envPath, "utf-8");
		if (content) {
			return dotenv.parse(content);
		}
	} catch (error) {
		console.error(`Error reading ${envFile} file:`, error);
	}
	return null;
}
