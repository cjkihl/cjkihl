#!/usr/bin/env node

import { Command } from "commander";
import setTurboEnv from "./index.pub.ts";

const program = new Command();

program
	.name("turbo-env")
	.description(
		"CLI tool to set up Turborepo environment variables from .env files",
	)
	.version("1.0.0")
	.option(
		"-e, --env-files <files...>",
		"Environment files to read from (in order of priority)",
		[".env.local", ".env", ".env.default"],
	)
	.action(async (options) => {
		try {
			await setTurboEnv({ envFile: options.envFiles });
			console.log(
				"✅ Successfully updated turbo.json with environment variables",
			);
		} catch (error) {
			console.error(
				"❌ Error:",
				error instanceof Error ? error.message : error,
			);
			process.exit(1);
		}
	});

program.parse();
