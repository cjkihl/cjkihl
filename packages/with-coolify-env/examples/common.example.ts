#!/usr/bin/env node

/**
 * Example usage of the with-coolify-env package
 *
 * This file demonstrates how to use the package both as a library
 * and shows the expected behavior in different scenarios.
 */

import { loadEnv, type WithCoolifyEnvConfig } from "../index.pub.ts";

/**
 * Example 1: Basic usage with environment variables
 *
 * This example assumes you have set the following environment variables:
 * - COOLIFY_ENDPOINT
 * - COOLIFY_APP_ID
 * - COOLIFY_TOKEN
 */
async function basicExample() {
	console.log("Example 1: Basic usage with environment variables");

	try {
		await loadEnv({
			args: ["Hello from Coolify!"],
			command: "echo",
		});
	} catch (error) {
		console.error(
			"Basic example failed:",
			error instanceof Error ? error.message : error,
		);
	}
}

/**
 * Example 2: Explicit configuration
 */
async function explicitConfigExample() {
	console.log("\nExample 2: Explicit configuration");

	const config: WithCoolifyEnvConfig = {
		appId: "my-app-id",
		args: ["--version"],
		command: "node",
		endpoint: "https://coolify.example.com",
		token: "my-api-token",
	};

	try {
		await loadEnv(config);
	} catch (error) {
		console.error(
			"Explicit config example failed:",
			error instanceof Error ? error.message : error,
		);
	}
}

/**
 * Example 3: Error handling demonstration
 */
async function errorHandlingExample() {
	console.log("\nExample 3: Error handling demonstration");

	try {
		// This will fail because no command is provided
		await loadEnv({});
	} catch (error) {
		console.log(
			"Expected error caught:",
			error instanceof Error ? error.message : error,
		);
	}
}

/**
 * Main function to run all examples
 */
async function runExamples() {
	console.log("Running with-coolify-env examples...\n");

	await basicExample();
	await explicitConfigExample();
	await errorHandlingExample();

	console.log("\nExamples completed!");
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	runExamples().catch(console.error);
}

export {
	basicExample,
	explicitConfigExample,
	errorHandlingExample,
	runExamples,
};
