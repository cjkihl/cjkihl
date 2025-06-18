#!/usr/bin/env node

import {
	resolveWorkspaceDependencies,
	restoreWorkspaceDependencies,
} from "./dep-resolver.js";

// CLI interface
async function main() {
	const args = process.argv.slice(2);
	const command = args[0];
	const cwd = process.cwd();

	switch (command) {
		case "resolve":
			await resolveWorkspaceDependencies(cwd);
			break;
		case "restore":
			await restoreWorkspaceDependencies(cwd);
			break;
		default:
			console.log(`
  Usage: 
    npm run resolve-workspace-deps resolve  # Resolve workspace dependencies before publishing
    npm run resolve-workspace-deps restore  # Restore original workspace dependencies after publishing
        `);
	}
}

if (require.main === module) {
	main().catch(console.error);
}
