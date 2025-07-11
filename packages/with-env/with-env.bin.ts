#!/usr/bin/env node

import { Command } from "commander";
import { loadEnv, type WithEnvConfig } from "./index.pub.js";

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
			const config: WithEnvConfig = {
				args,
				command,
			};

			// Only add envFile if it's provided
			if (options.envFile) {
				config.envFile = options.envFile;
			}

			await loadEnv(config);
		} catch (error) {
			console.error("Error:", error instanceof Error ? error.message : error);
			process.exit(1);
		}
	});

program.parse();
