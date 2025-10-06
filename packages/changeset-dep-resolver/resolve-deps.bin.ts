#!/usr/bin/env node

import { Command } from "commander";
import {
	resolveWorkspaceDependencies,
	restoreWorkspaceDependencies,
} from "./dep-resolver.ts";

const program = new Command();

program
	.name("resolve-deps")
	.description("CLI to manage workspace dependencies for publishing")
	.version("0.1.4");

program
	.command("resolve")
	.description("Resolve workspace dependencies before publishing")
	.action(async () => {
		try {
			await resolveWorkspaceDependencies(process.cwd());
		} catch (error) {
			console.error("Error resolving dependencies:", error);
			process.exit(1);
		}
	});

program
	.command("restore")
	.description("Restore original workspace dependencies after publishing")
	.action(async () => {
		try {
			await restoreWorkspaceDependencies(process.cwd());
		} catch (error) {
			console.error("Error restoring dependencies:", error);
			process.exit(1);
		}
	});

program.parse();
