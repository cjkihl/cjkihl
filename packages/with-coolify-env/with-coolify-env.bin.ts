#!/usr/bin/env node

import { Command } from "commander";
import { loadEnv } from "./index.pub.ts";

const program = new Command();

program
	.name("with-coolify-env")
	.description(
		"Load environment variables from Coolify and execute commands with those variables",
	)
	.version("0.1.18")
	.option("--endpoint <url>", "Coolify API endpoint URL")
	.option("--app-id <id>", "Coolify application ID")
	.option("--token <token>", "Coolify API token")
	.argument("<command>", "Command to execute")
	.argument("[args...]", "Arguments to pass to the command")
	.action(async (command, args, options) => {
		try {
			await loadEnv({
				appId: options.appId,
				args,
				command,
				endpoint: options.endpoint,
				token: options.token,
			});
		} catch (error) {
			console.error("Error:", error instanceof Error ? error.message : error);
			process.exit(1);
		}
	});

program.parse();
