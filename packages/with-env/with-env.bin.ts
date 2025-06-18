#!/usr/bin/env node

import { loadEnv } from "./index.pub.js";

const args = process.argv.slice(2);
const options: Record<string, string | boolean> = {};
const command: string[] = [];

// Parse options
for (let i = 0; i < args.length; i++) {
	const arg = args[i];
	if (!arg) continue;

	if (arg.startsWith("--")) {
		const [key, value] = arg.slice(2).split("=");
		if (!key) continue;

		if (value === undefined) {
			options[key] = true;
		} else {
			options[key] = value;
		}
	} else {
		command.push(...args.slice(i));
		break;
	}
}

// Convert options to WithEnvConfig
const config = {
	envFile: options["env-file"] as string[] | undefined,
	inheritStdio: options["inherit-stdio"] !== false,
	skipInProduction: options["skip-production"] !== false,
};

// Execute loadEnv with the parsed config and remaining command
loadEnv({
	...config,
	args: command.slice(1),
	command: command[0],
}).catch((error) => {
	console.error(error);
	process.exit(1);
});
