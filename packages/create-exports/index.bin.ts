#!/usr/bin/env node

import { createExports } from "./create-exports.js";

// Parse command line arguments
const args = process.argv.slice(2);
const options: {
	packageJsonPath?: string;
	tsconfigPath?: string;
	dryRun?: boolean;
} = {};

function showHelp() {
	console.log(`
Usage: create-exports [options]

Options:
  -p, --package-json <path>  Path to package.json file
  -t, --tsconfig <path>      Path to tsconfig.json file
  -d, --dry-run             Show what would be changed without writing
  -h, --help                Show this help message

Examples:
  create-exports
  create-exports --dry-run
  create-exports --package-json ./custom/package.json --tsconfig ./custom/tsconfig.json
`);
	process.exit(0);
}

// Parse arguments
for (let i = 0; i < args.length; i++) {
	const arg = args[i];
	switch (arg) {
		case "--package-json":
		case "-p": {
			options.packageJsonPath = args[++i];
			break;
		}
		case "--tsconfig":
		case "-t": {
			options.tsconfigPath = args[++i];
			break;
		}
		case "--dry-run":
		case "-d": {
			options.dryRun = true;
			break;
		}
		case "--help":
		case "-h": {
			showHelp();
			break;
		}
		default: {
			console.error(`Unknown option: ${arg}`);
			console.error("Use --help for usage information");
			process.exit(1);
		}
	}
}

// Run createExports with the parsed options
createExports(options).catch((error) => {
	console.error("Error:", error.message);
	process.exit(1);
}); 