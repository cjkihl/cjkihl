#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
	getKeywordMetrics,
	getKeywordMetricsSchema,
	researchKeywords,
	researchKeywordsSchema,
} from "./google-ads.ts";
import "dotenv/config";

// Plain shape objects for MCP tool registration. SDK uses Zod 3 types; Zod 4
// causes "excessively deep" inference, so we cast when passing to server.tool().
const researchKeywordsShape = {
	keyword: z.string().describe("Seed keyword to find similar keywords from"),
	language: z
		.string()
		.optional()
		.default("en")
		.describe("Language code (e.g. 'en')"),
	limit: z
		.number()
		.optional()
		.default(50)
		.describe("Max number of similar keywords to return"),
	locations: z
		.array(z.number())
		.optional()
		.default([2840])
		.describe("Array of location IDs (default 2840 for US)"),
};

const getKeywordMetricsShape = {
	keywords: z
		.array(z.string())
		.min(1)
		.describe("Array of keywords to get metrics for"),
	language: z
		.string()
		.optional()
		.default("en")
		.describe("Language code (e.g. 'en')"),
	locations: z
		.array(z.number())
		.optional()
		.default([2840])
		.describe("Array of location IDs (default 2840 for US)"),
};

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
// Use registerTool to avoid Zod 4 vs SDK (Zod 3) type deep-instantiation with tool().
server.registerTool(
	"research-keywords",
	{
		description:
			"Research keywords: Find similar keywords based on a seed keyword. Useful for keyword discovery and expansion. Returns similar keywords with search volume, CPC, and competition metrics.",
		// biome-ignore lint/suspicious/noExplicitAny: Zod 4 shape → SDK (Zod 3) inputSchema
		inputSchema: researchKeywordsShape as any,
	},
	async (args: unknown, _extra: unknown) => {
		try {
			const keywords = await researchKeywords(
				researchKeywordsSchema.parse(args),
			);
			return {
				content: [
					{
						text: JSON.stringify(keywords, null, 2),
						type: "text" as const,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						text: `Error researching keywords: ${error instanceof Error ? error.message : String(error)}`,
						type: "text" as const,
					},
				],
				isError: true,
			};
		}
	},
);

// Keyword Planning Tool: Get detailed metrics for a list of known keywords
server.registerTool(
	"get-keyword-metrics",
	{
		description:
			"Get keyword metrics: Retrieve detailed metrics (search volume, CPC, competition, competition index) for a list of known keywords. Useful for keyword planning and analysis.",
		// biome-ignore lint/suspicious/noExplicitAny: Zod 4 shape → SDK (Zod 3) inputSchema
		inputSchema: getKeywordMetricsShape as any,
	},
	async (args: unknown, _extra: unknown) => {
		try {
			const metrics = await getKeywordMetrics(
				getKeywordMetricsSchema.parse(args),
			);
			return {
				content: [
					{
						text: JSON.stringify(metrics, null, 2),
						type: "text" as const,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						text: `Error getting keyword metrics: ${error instanceof Error ? error.message : String(error)}`,
						type: "text" as const,
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
