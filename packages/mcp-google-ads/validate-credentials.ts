#!/usr/bin/env bun
/**
 * Simple script to validate Google Ads API credentials are loaded correctly
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

console.log("🔍 Validating Google Ads API credentials...\n");

// Check for service account
const serviceAccountPath =
	process.env.GOOGLE_ADS_SERVICE_ACCOUNT_PATH ||
	process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (serviceAccountPath) {
	console.log("✓ Service account path found:", serviceAccountPath);
	try {
		const resolvedPath = resolve(serviceAccountPath);
		const content = readFileSync(resolvedPath, "utf-8");
		const sa = JSON.parse(content);

		if (sa.type === "service_account") {
			console.log("✓ Service account file is valid");
			console.log("  - Type:", sa.type);
			console.log("  - Client Email:", sa.client_email);
			console.log("  - Project ID:", sa.project_id);
			console.log("  - Has Private Key:", sa.private_key ? "Yes" : "No");
		} else {
			console.log("✗ Service account file is not a valid service account");
		}
	} catch (error) {
		console.log(
			"✗ Error reading service account file:",
			error instanceof Error ? error.message : String(error),
		);
		process.exit(1);
	}
} else {
	console.log("ℹ No service account path found");
}

// Check for OAuth credentials
const hasOAuth =
	!!process.env.GOOGLE_ADS_CLIENT_ID &&
	!!process.env.GOOGLE_ADS_CLIENT_SECRET &&
	!!process.env.GOOGLE_ADS_REFRESH_TOKEN;

if (hasOAuth) {
	console.log("✓ OAuth credentials found");
	console.log(
		"  - Client ID:",
		process.env.GOOGLE_ADS_CLIENT_ID ? "Set" : "Not set",
	);
	console.log(
		"  - Client Secret:",
		process.env.GOOGLE_ADS_CLIENT_SECRET ? "Set" : "Not set",
	);
	console.log(
		"  - Refresh Token:",
		process.env.GOOGLE_ADS_REFRESH_TOKEN ? "Set" : "Not set",
	);
} else {
	console.log("ℹ OAuth credentials not found");
}

// Check required fields
const hasDeveloperToken = !!process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
const hasCustomerId = !!process.env.GOOGLE_ADS_CUSTOMER_ID;

console.log("\n📋 Required Configuration:");
console.log("  - Developer Token:", hasDeveloperToken ? "✓ Set" : "✗ Missing");
console.log("  - Customer ID:", hasCustomerId ? "✓ Set" : "✗ Missing");

// Summary
console.log("\n📊 Summary:");
if (serviceAccountPath && hasDeveloperToken && hasCustomerId) {
	console.log("✓ Service Account authentication configured");
	console.log("  Authentication method: Service Account");
} else if (hasOAuth && hasDeveloperToken && hasCustomerId) {
	console.log("✓ OAuth authentication configured");
	console.log("  Authentication method: OAuth 2.0");
} else {
	console.log("✗ Credentials not fully configured");
	if (!hasDeveloperToken)
		console.log("  - Missing: GOOGLE_ADS_DEVELOPER_TOKEN");
	if (!hasCustomerId) console.log("  - Missing: GOOGLE_ADS_CUSTOMER_ID");
	if (!serviceAccountPath && !hasOAuth) {
		console.log(
			"  - Missing: Either service account path or OAuth credentials",
		);
	}
	process.exit(1);
}

console.log("\n✅ Credentials validation complete!");
