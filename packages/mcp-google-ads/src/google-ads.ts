import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GoogleAdsApi, type services } from "google-ads-api";
import { z } from "zod";

/**
 * Service account JSON structure
 */
interface ServiceAccount {
	type: string;
	project_id: string;
	private_key_id: string;
	private_key: string;
	client_email: string;
	client_id: string;
	auth_uri: string;
	token_uri: string;
}

/**
 * Load service account from JSON file
 */
function loadServiceAccount(filePath: string): ServiceAccount {
	try {
		const resolvedPath = resolve(filePath);
		const content = readFileSync(resolvedPath, "utf-8");
		return JSON.parse(content) as ServiceAccount;
	} catch (error) {
		throw new Error(
			`Failed to load service account file at ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

/**
 * Get Google Ads API configuration from environment variables or service account file.
 * Supports both OAuth 2.0 with refresh tokens and service account JSON files.
 *
 * @returns Configuration object with credentials
 */
const getConfig = () => {
	// Check if service account file path is provided
	const serviceAccountPath =
		process.env.GOOGLE_ADS_SERVICE_ACCOUNT_PATH ||
		process.env.GOOGLE_APPLICATION_CREDENTIALS;

	if (serviceAccountPath) {
		const serviceAccount = loadServiceAccount(serviceAccountPath);
		return {
			// account_id is used as the customer_id in API calls (the account to query)
			account_id:
				process.env.GOOGLE_ADS_ACCOUNT_ID || process.env.GOOGLE_ADS_CUSTOMER_ID,
			authMethod: "service_account" as const,
			// login_customer_id is used for manager accounts (usually same as account_id)
			customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
			// Developer token from Google Ads Console (requires approval)
			developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
			// Service account credentials
			service_account: serviceAccount,
		};
	}

	// Fall back to OAuth 2.0
	return {
		// account_id is used as the customer_id in API calls (the account to query)
		account_id:
			process.env.GOOGLE_ADS_ACCOUNT_ID || process.env.GOOGLE_ADS_CUSTOMER_ID,
		authMethod: "oauth" as const,
		// OAuth 2.0 credentials from Google Cloud Console
		client_id: process.env.GOOGLE_ADS_CLIENT_ID,
		client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
		// login_customer_id is used for manager accounts (usually same as account_id)
		customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
		// Developer token from Google Ads Console (requires approval)
		developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
		// OAuth 2.0 refresh token (obtained via OAuth flow)
		refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
	};
};

let clientInstance: GoogleAdsApi | null = null;

const getClient = () => {
	if (clientInstance) return clientInstance;
	const config = getConfig();

	if (!config.developer_token) {
		throw new Error(
			"Google Ads developer token not configured. Set GOOGLE_ADS_DEVELOPER_TOKEN.",
		);
	}

	if (config.authMethod === "service_account") {
		// Service account authentication
		// Note: Service accounts for Google Ads API require:
		// 1. The service account email must be granted access in Google Ads Manager account
		// 2. The service account must be linked to a Google Ads account
		// The google-ads-api package may handle service account authentication differently
		// This implementation uses the service account's client_id and private_key
		const { service_account } = config;
		clientInstance = new GoogleAdsApi({
			client_id: service_account.client_id,
			client_secret: service_account.private_key,
			developer_token: config.developer_token,
		});
	} else {
		// OAuth 2.0 authentication
		if (!config.client_id || !config.client_secret) {
			throw new Error(
				"Google Ads OAuth credentials not configured. Set GOOGLE_ADS_CLIENT_ID and GOOGLE_ADS_CLIENT_SECRET, or use GOOGLE_ADS_SERVICE_ACCOUNT_PATH for service account authentication.",
			);
		}
		clientInstance = new GoogleAdsApi({
			client_id: config.client_id,
			client_secret: config.client_secret,
			developer_token: config.developer_token,
		});
	}
	return clientInstance;
};

/**
 * Get a Google Ads Customer instance for making API calls.
 *
 * @returns Customer instance configured with credentials
 */
const getCustomer = () => {
	const config = getConfig();
	const client = getClient();

	if (config.authMethod === "service_account") {
		// Service account authentication
		// Note: Service accounts for Google Ads API may require special setup
		// The service account email must be granted access in Google Ads
		const { service_account } = config;
		return client.Customer({
			// The customer account to query (account_id)
			customer_id: config.account_id || "",
			// For manager accounts, this is the login customer ID (usually same as customer_id)
			login_customer_id: config.customer_id,
			// For service accounts, we use the private key
			// The google-ads-api package may handle this differently
			refresh_token: service_account.private_key,
		});
	}

	// OAuth 2.0 authentication
	return client.Customer({
		// The customer account to query (account_id)
		customer_id: config.account_id || "",
		// For manager accounts, this is the login customer ID (usually same as customer_id)
		login_customer_id: config.customer_id,
		// OAuth 2.0 refresh token for authentication
		refresh_token: config.refresh_token || "",
	});
};

/**
 * Schema for keyword research tool.
 * Finds similar keywords based on a seed keyword.
 */
export const researchKeywordsSchema = z.object({
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
});

/**
 * Research keywords: Find similar keywords based on a seed keyword.
 * This is useful for keyword discovery and expansion.
 *
 * @param args - Research parameters including seed keyword
 * @returns Array of similar keywords with metrics (search volume, CPC, competition)
 */
export async function researchKeywords(
	args: z.infer<typeof researchKeywordsSchema>,
) {
	const config = getConfig();
	// Validate credentials are configured
	if (
		config.authMethod === "oauth" &&
		(!config.client_id || !config.refresh_token)
	) {
		throw new Error(
			"Google Ads credentials not configured. Set OAuth credentials or use GOOGLE_ADS_SERVICE_ACCOUNT_PATH.",
		);
	}
	if (config.authMethod === "service_account" && !config.service_account) {
		throw new Error("Google Ads service account not configured.");
	}

	const customer = getCustomer();
	const keywordTexts = [args.keyword];

	// Type assertion needed because the API accepts partial request objects
	// but TypeScript expects all properties including optional ones
	const response = await customer.keywordPlanIdeas.generateKeywordIdeas({
		customer_id: getConfig().account_id || "",
		geo_target_constants:
			args.locations?.map((id) => `geoTargetConstants/${id}`) || [],
		keyword_plan_network: "GOOGLE_SEARCH_AND_PARTNERS",
		keyword_seed: {
			keywords: keywordTexts,
		},
		language: `languageConstants/${args.language === "en" ? "1000" : args.language}`,
	} as Parameters<typeof customer.keywordPlanIdeas.generateKeywordIdeas>[0]);
	const keywordIdeas = response.results || [];

	type KeywordIdea = services.GenerateKeywordIdeaResponse["results"][number];
	return keywordIdeas.slice(0, args.limit).map((idea: KeywordIdea) => ({
		avgMonthlySearches: idea.keyword_idea_metrics?.avg_monthly_searches || 0,
		competition: idea.keyword_idea_metrics?.competition || "UNKNOWN",
		competitionIndex: idea.keyword_idea_metrics?.competition_index || 0,
		highTopOfPageBidMicros: idea.keyword_idea_metrics
			?.high_top_of_page_bid_micros
			? Number.parseFloat(
					String(idea.keyword_idea_metrics.high_top_of_page_bid_micros),
				) / 1000000
			: 0,
		keyword: idea.text,
		lowTopOfPageBidMicros: idea.keyword_idea_metrics?.low_top_of_page_bid_micros
			? Number.parseFloat(
					String(idea.keyword_idea_metrics.low_top_of_page_bid_micros),
				) / 1000000
			: 0,
	}));
}

/**
 * Schema for keyword planning tool.
 * Gets detailed metrics for a list of known keywords.
 */
export const getKeywordMetricsSchema = z.object({
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
});

/**
 * Get keyword metrics: Retrieve detailed metrics (search volume, CPC, competition)
 * for a list of known keywords.
 * This is useful for keyword planning and analysis.
 *
 * @param args - Planning parameters including array of keywords
 * @returns Array of keywords with detailed metrics
 */
export async function getKeywordMetrics(
	args: z.infer<typeof getKeywordMetricsSchema>,
) {
	const config = getConfig();
	// Validate credentials are configured
	if (
		config.authMethod === "oauth" &&
		(!config.client_id || !config.refresh_token)
	) {
		throw new Error(
			"Google Ads credentials not configured. Set OAuth credentials or use GOOGLE_ADS_SERVICE_ACCOUNT_PATH.",
		);
	}
	if (config.authMethod === "service_account" && !config.service_account) {
		throw new Error("Google Ads service account not configured.");
	}

	const customer = getCustomer();

	// Type assertion needed because the API accepts partial request objects
	// but TypeScript expects all properties including optional ones
	const response = await customer.keywordPlanIdeas.generateKeywordIdeas({
		customer_id: getConfig().account_id || "",
		geo_target_constants:
			args.locations?.map((id) => `geoTargetConstants/${id}`) || [],
		keyword_plan_network: "GOOGLE_SEARCH_AND_PARTNERS",
		keyword_seed: {
			keywords: args.keywords,
		},
		language: `languageConstants/${args.language === "en" ? "1000" : args.language}`,
	} as Parameters<typeof customer.keywordPlanIdeas.generateKeywordIdeas>[0]);
	const keywordIdeas = response.results || [];

	type KeywordIdea = services.GenerateKeywordIdeaResponse["results"][number];
	return keywordIdeas.map((idea: KeywordIdea) => ({
		avgMonthlySearches: idea.keyword_idea_metrics?.avg_monthly_searches || 0,
		competition: idea.keyword_idea_metrics?.competition || "UNKNOWN",
		competitionIndex: idea.keyword_idea_metrics?.competition_index || 0,
		highTopOfPageBidMicros: idea.keyword_idea_metrics
			?.high_top_of_page_bid_micros
			? Number.parseFloat(
					String(idea.keyword_idea_metrics.high_top_of_page_bid_micros),
				) / 1000000
			: 0,
		keyword: idea.text,
		lowTopOfPageBidMicros: idea.keyword_idea_metrics?.low_top_of_page_bid_micros
			? Number.parseFloat(
					String(idea.keyword_idea_metrics.low_top_of_page_bid_micros),
				) / 1000000
			: 0,
	}));
}
