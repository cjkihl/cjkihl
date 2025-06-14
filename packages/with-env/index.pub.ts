import node_path from "node:path";
import { findRoot } from "@cjkihl/find-root";
import dotenv, { type DotenvParseOutput } from "dotenv";
import { spawn, type ChildProcess } from "node:child_process";
import { readFile } from "node:fs/promises";

export interface WithEnvConfig {
	envFile?: string;
	skipInProduction?: boolean;
	inheritStdio?: boolean;
}

const defaultConfig: Required<WithEnvConfig> = {
	envFile: ".env.local",
	skipInProduction: true,
	inheritStdio: true,
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

	const args = process.argv.slice(2);
	if (!args[0]) {
		throw new Error("No command provided to execute");
	}

	const command = args[0];
	console.log("Spawning process with arguments:", command, args.slice(1));

	return new Promise<void>((resolve, reject) => {
		const proc: ChildProcess = spawn(command, args.slice(1), {
			env: process.env,
			stdio: finalConfig.inheritStdio ? "inherit" : "pipe",
			shell: true,
		});

		proc.on("exit", (code: number | null) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`Process exited with code ${code}`));
			}
		});

		proc.on("error", (err: Error) => {
			reject(err);
		});
	});
}

async function getEnvs(envFile: string): Promise<DotenvParseOutput | null> {
	const { root } = await findRoot();
	const envPath = node_path.join(root, envFile);
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