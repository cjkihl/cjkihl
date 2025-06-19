#!/usr/bin/env node

import { loadEnv } from "./index.pub.js";

/**
 * CLI interface for the Coolify environment loader
 *
 * This script provides a command-line interface for loading environment variables
 * from Coolify and executing commands with those variables loaded.
 *
 * Usage:
 *   with-coolify-env [options] <command> [args...]
 *
 * Options:
 *   --endpoint=<url>        Coolify API endpoint URL
 *   --app-id=<id>          Coolify application ID
 *   --token=<token>        Coolify API token
 *   --skip-production      Skip loading env vars in production (default: true)
 *   --inherit-stdio=<bool> Inherit stdio from parent process (default: true)
 *   --help                 Show this help message
 *
 * Environment Variables:
 *   COOLIFY_ENDPOINT       Coolify API endpoint URL (fallback)
 *   COOLIFY_APP_ID         Coolify application ID (fallback)
 *   COOLIFY_TOKEN          Coolify API token (fallback)
 *
 * Examples:
 *   with-coolify-env npm start
 *   with-coolify-env --endpoint=https://coolify.example.com --app-id=my-app node server.js
 *   with-coolify-env --skip-production=false npm run build
 */

/**
 * Shows the help message and exits
 */
function showHelp(): never {
	console.log(`
Usage: with-coolify-env [options] <command> [args...]

Load environment variables from Coolify and execute a command with those variables.

Options:
  --endpoint=<url>        Coolify API endpoint URL
  --app-id=<id>          Coolify application ID  
  --token=<token>        Coolify API token
  --skip-production      Skip loading env vars in production (default: true)
  --inherit-stdio=<bool> Inherit stdio from parent process (default: true)
  --help                 Show this help message

Environment Variables (used as fallbacks):
  COOLIFY_ENDPOINT       Coolify API endpoint URL
  COOLIFY_APP_ID         Coolify application ID
  COOLIFY_TOKEN          Coolify API token

Examples:
  with-coolify-env npm start
  with-coolify-env --endpoint=https://coolify.example.com --app-id=my-app node server.js
  with-coolify-env --skip-production=false npm run build
`);
	process.exit(0);
}

/**
 * Parses command line arguments and extracts options and command
 *
 * @param args - Command line arguments array
 * @returns Object containing parsed options and command with arguments
 */
function parseArgs(args: string[]): {
	options: Record<string, string | boolean>;
	command: string[];
} {
	const options: Record<string, string | boolean> = {};
	const command: string[] = [];

	// Parse options
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (!arg) continue;

		// Handle help flag
		if (arg === "--help" || arg === "-h") {
			showHelp();
		}

		// Parse option flags
		if (arg.startsWith("--")) {
			const [key, value] = arg.slice(2).split("=");
			if (!key) continue;

			// Handle boolean flags
			if (value === undefined) {
				options[key] = true;
			} else {
				// Handle string values
				options[key] = value;
			}
		} else {
			// Everything after the first non-option argument is part of the command
			command.push(...args.slice(i));
			break;
		}
	}

	return { command, options };
}

/**
 * Converts CLI options to the configuration format expected by loadEnv
 *
 * @param options - Parsed CLI options
 * @returns Configuration object for loadEnv
 */
function convertOptionsToConfig(options: Record<string, string | boolean>) {
	return {
		appId: options["app-id"] as string | undefined,
		endpoint: options.endpoint as string | undefined,
		inheritStdio: options["inherit-stdio"] !== false,
		skipInProduction: options["skip-production"] !== false,
		token: options.token as string | undefined,
	};
}

// Main execution
try {
	const args = process.argv.slice(2);

	// Show help if no arguments provided
	if (args.length === 0) {
		showHelp();
	}

	const { options, command } = parseArgs(args);

	// Validate that a command was provided
	if (command.length === 0) {
		console.error("Error: No command provided");
		console.error("Use --help for usage information");
		process.exit(1);
	}

	// Convert options to configuration format
	const config = convertOptionsToConfig(options);

	// Execute loadEnv with the parsed config and remaining command
	loadEnv({
		...config,
		args: command.slice(1),
		command: command[0],
	}).catch((error) => {
		console.error("Error:", error.message);
		process.exit(1);
	});
} catch (error) {
	console.error(
		"Unexpected error:",
		error instanceof Error ? error.message : error,
	);
	process.exit(1);
}
