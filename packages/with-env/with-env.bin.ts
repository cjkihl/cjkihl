#!/usr/bin/env node

import { type LoadEnvConfig, loadEnv, spawn } from "./index.pub.ts";
import { parseArgv } from "./parse-argv.ts";

async function main(): Promise<void> {
	const { command, args, envFile } = parseArgv(process.argv.slice(2));

	try {
		const envConfig: LoadEnvConfig = {};
		if (envFile) {
			// Explicit env file(s) always win
			envConfig.envFile = envFile;
		} else {
			const nodeEnv = process.env.NODE_ENV;
			// For non-development environments, try .env.{NODE_ENV}
			if (nodeEnv && nodeEnv !== "development") {
				envConfig.envFile = [`.env.${nodeEnv}`];
			}
			// For development or when NODE_ENV is not set, rely on loadEnv defaults:
			// .env.default, .env, .env.local
		}
		console.log("loading env files:", envConfig.envFile?.join(", "));
		await loadEnv(envConfig);

		await spawn({ args, command });
	} catch (error) {
		console.error("Error:", error instanceof Error ? error.message : error);
		process.exit(1);
	}
}

main();
