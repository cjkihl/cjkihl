#!/usr/bin/env node

import { Command } from "commander";
import { type LoadEnvConfig, loadEnv, spawn } from "./index.pub.js";

const program = new Command();

program
	.name("with-env")
	.description("Load environment variables in a monorepo")
	.version("0.1.18")
	.option("--env-file <files...>", "Environment files to load")
	.argument("<command>", "Command to execute")
	.argument("[args...]", "Arguments to pass to the command")
	.action(async (command, args, options) => {
		try {
			const envConfig: LoadEnvConfig = {};

			// Only add envFile if it's provided
			if (options.envFile) {
				envConfig.envFile = options.envFile;
			}

			await loadEnv(envConfig);
			await spawn({
				args,
				command,
			});
		} catch (error) {
			console.error("Error:", error instanceof Error ? error.message : error);
			process.exit(1);
		}
	});

program.parse();
