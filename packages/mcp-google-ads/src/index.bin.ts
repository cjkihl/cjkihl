#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	getKeywordMetrics,
	getKeywordMetricsSchema,
	researchKeywords,
	researchKeywordsSchema,
} from "./google-ads.ts";
import "dotenv/config";

// parsing process.args for --GOOGLE_ADS_CLIENT_ID, etc
// Parse command line arguments
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
	const arg = args[i];
	if (arg?.startsWith("--")) {
		const key = arg.slice(2);
		// Check if it's one of our expected env vars
		if (
			[
				"GOOGLE_ADS_CLIENT_ID",
				"GOOGLE_ADS_CLIENT_SECRET",
				"GOOGLE_ADS_DEVELOPER_TOKEN",
				"GOOGLE_ADS_REFRESH_TOKEN",
				"GOOGLE_ADS_CUSTOMER_ID",
				"GOOGLE_ADS_ACCOUNT_ID",
				"GOOGLE_ADS_SERVICE_ACCOUNT_PATH",
				"GOOGLE_APPLICATION_CREDENTIALS",
			].includes(key)
		) {
			// Look for value in next arg or validation
			if (i + 1 < args.length && !args[i + 1]?.startsWith("--")) {
				process.env[key] = args[i + 1];
				i++; // skip next arg
			}
		}
	}
}

const server = new McpServer({
	name: "mcp-google-ads",
	version: "0.1.0",
});

// Keyword Research Tool: Find similar keywords based on a seed keyword
server.tool(
	"research-keywords",
	"Research keywords: Find similar keywords based on a seed keyword. Useful for keyword discovery and expansion. Returns similar keywords with search volume, CPC, and competition metrics.",
	researchKeywordsSchema.shape,
	async (args) => {
		try {
			const keywords = await researchKeywords(args);
			return {
				content: [
					{
						text: JSON.stringify(keywords, null, 2),
						type: "text",
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						text: `Error researching keywords: ${error instanceof Error ? error.message : String(error)}`,
						type: "text",
					},
				],
				isError: true,
			};
		}
	},
);

// Keyword Planning Tool: Get detailed metrics for a list of known keywords
server.tool(
	"get-keyword-metrics",
	"Get keyword metrics: Retrieve detailed metrics (search volume, CPC, competition, competition index) for a list of known keywords. Useful for keyword planning and analysis.",
	getKeywordMetricsSchema.shape,
	async (args) => {
		try {
			const metrics = await getKeywordMetrics(args);
			return {
				content: [
					{
						text: JSON.stringify(metrics, null, 2),
						type: "text",
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						text: `Error getting keyword metrics: ${error instanceof Error ? error.message : String(error)}`,
						type: "text",
					},
				],
				isError: true,
			};
		}
	},
);

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("Google Ads MCP Server running on stdio");
}

main().catch((error) => {
	console.error("Fatal error in main loop:", error);
	process.exit(1);
});
