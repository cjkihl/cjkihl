#!/usr/bin/env node

/**
 * Basic test for the with-coolify-env package
 *
 * This test verifies that the package can be imported and used
 * without actually making API calls to Coolify.
 */

import { loadEnv, type WithCoolifyEnvConfig } from "../index.pub.ts";

/**
 * Test configuration validation
 */
function testConfigValidation() {
	console.log("Testing configuration validation...");

	// Test that the interface is properly exported
	const config: WithCoolifyEnvConfig = {
		appId: "test-app",
		args: ["test"],
		command: "echo",
		endpoint: "https://test.example.com",
		token: "test-token",
	};

	console.log("✓ Configuration interface works correctly");
	return config;
}

/**
 * Test error handling for missing command
 */
async function testMissingCommand() {
	console.log("\nTesting missing command error...");

	try {
		await loadEnv({});
		console.log("✗ Should have thrown an error for missing command");
		return false;
	} catch (error) {
		if (
			error instanceof Error &&
			error.message.includes("No command provided")
		) {
			console.log("✓ Correctly throws error for missing command");
			return true;
		}
		console.log("✗ Unexpected error:", error);
		return false;
	}
}

/**
 * Test that the package can be imported and basic functionality works
 */
async function testBasicFunctionality() {
	console.log("\nTesting basic functionality...");

	// Test error handling
	const errorHandlingWorks = await testMissingCommand();

	if (errorHandlingWorks) {
		console.log("\n✓ All basic tests passed!");
		console.log("✓ Package is properly structured and exported");
		console.log("✓ Error handling works correctly");
		return true;
	}
	console.log("\n✗ Some tests failed");
	return false;
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	testBasicFunctionality()
		.then((success) => {
			process.exit(success ? 0 : 1);
		})
		.catch((error) => {
			console.error("Test failed with error:", error);
			process.exit(1);
		});
}

export { testConfigValidation, testMissingCommand, testBasicFunctionality };
