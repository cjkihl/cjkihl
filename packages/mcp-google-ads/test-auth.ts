#!/usr/bin/env bun
/**
 * Test script to validate Google Ads API authentication
 */
import "dotenv/config";
import { researchKeywords } from "./src/google-ads.ts";

async function testAuth() {
	console.log("🧪 Testing Google Ads API authentication...\n");

	try {
		console.log("Attempting to make API call...");
		const result = await researchKeywords({
			keyword: "test",
			language: "en",
			limit: 1,
			locations: [2840],
		});

		console.log("✅ Authentication successful!");
		console.log(`Received ${result.length} keyword(s)`);
		if (result.length > 0) {
			console.log("Sample result:", JSON.stringify(result[0], null, 2));
		}
	} catch (error) {
		console.log("❌ Authentication failed:");
		console.log("Error type:", error?.constructor?.name);
		console.log(
			"Error message:",
			error instanceof Error ? error.message : String(error),
		);

		if (error instanceof Error && error.stack) {
			console.log("\nStack trace:");
			console.log(error.stack);
		}

		process.exit(1);
	}
}

testAuth();
