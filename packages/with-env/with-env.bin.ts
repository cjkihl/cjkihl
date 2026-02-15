#!/usr/bin/env node

import { type LoadEnvConfig, loadEnv, spawn } from "./index.pub.ts";
import { parseArgv } from "./parse-argv.ts";

async function main(): Promise<void> {
	const { command, args, envFile } = parseArgv(process.argv.slice(2));

	try {
		if (process.env.NODE_ENV === "production") {
			console.log(
				"NODE_ENV is production, skipping environment variable loading",
			);
		} else {
			const envConfig: LoadEnvConfig = {};
			if (envFile) {
				envConfig.envFile = envFile;
			}
			await loadEnv(envConfig);
		}

		await spawn({ args, command });
	} catch (error) {
		console.error("Error:", error instanceof Error ? error.message : error);
		process.exit(1);
	}
}

main();
