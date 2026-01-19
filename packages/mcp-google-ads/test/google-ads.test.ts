import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { getKeywordMetrics, researchKeywords } from "../src/google-ads.js";

// Zod schema for validating keyword idea response format
const keywordIdeaSchema = z.object({
	avgMonthlySearches: z.number().int().min(0),
	competition: z.string(), // API may return various competition values
	competitionIndex: z.number().int().min(0).max(100),
	highTopOfPageBidMicros: z.number().min(0),
	keyword: z.string().min(1),
	lowTopOfPageBidMicros: z.number().min(0),
});

const keywordIdeasResponseSchema = z.array(keywordIdeaSchema);

// Helper function to check if credentials are configured
// Supports both OAuth 2.0 and service account authentication
const hasCredentials = () => {
	const hasDeveloperToken = !!process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
	const hasCustomerId = !!process.env.GOOGLE_ADS_CUSTOMER_ID;

	// Check for service account file path
	const hasServiceAccount = !!(
		process.env.GOOGLE_ADS_SERVICE_ACCOUNT_PATH ||
		process.env.GOOGLE_APPLICATION_CREDENTIALS
	);

	// Check for OAuth credentials
	const hasOAuth = !!(
		process.env.GOOGLE_ADS_CLIENT_ID &&
		process.env.GOOGLE_ADS_CLIENT_SECRET &&
		process.env.GOOGLE_ADS_REFRESH_TOKEN
	);

	return hasDeveloperToken && hasCustomerId && (hasServiceAccount || hasOAuth);
};

describe("researchKeywords", () => {
	test("should successfully generate and format keyword ideas with valid response format", async () => {
		if (!hasCredentials()) {
			console.warn(
				"Skipping test: Google Ads credentials not configured. Set either:\n" +
					"  - OAuth: GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CUSTOMER_ID\n" +
					"  - Service Account: GOOGLE_ADS_SERVICE_ACCOUNT_PATH (or GOOGLE_APPLICATION_CREDENTIALS), GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CUSTOMER_ID",
			);
			return;
		}

		const result = await researchKeywords({
			keyword: "marketing",
			language: "en",
			limit: 10,
			locations: [2840],
		});

		// Validate response format using zod
		const validatedResult = keywordIdeasResponseSchema.parse(result);

		expect(validatedResult).toBeDefined();
		expect(validatedResult.length).toBeGreaterThan(0);
		expect(validatedResult.length).toBeLessThanOrEqual(10);

		// Validate each keyword idea
		for (const idea of validatedResult) {
			expect(idea.keyword).toBeDefined();
			expect(idea.keyword.length).toBeGreaterThan(0);
			expect(idea.avgMonthlySearches).toBeGreaterThanOrEqual(0);
			expect(["UNKNOWN", "LOW", "MEDIUM", "HIGH"]).toContain(idea.competition);
			expect(idea.competitionIndex).toBeGreaterThanOrEqual(0);
			expect(idea.competitionIndex).toBeLessThanOrEqual(100);
			expect(idea.highTopOfPageBidMicros).toBeGreaterThanOrEqual(0);
			expect(idea.lowTopOfPageBidMicros).toBeGreaterThanOrEqual(0);
		}
	});

	test("should return results in correct format with default parameters", async () => {
		if (!hasCredentials()) {
			console.warn(
				"Skipping test: Google Ads credentials not configured. Set either:\n" +
					"  - OAuth: GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CUSTOMER_ID\n" +
					"  - Service Account: GOOGLE_ADS_SERVICE_ACCOUNT_PATH (or GOOGLE_APPLICATION_CREDENTIALS), GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CUSTOMER_ID",
			);
			return;
		}

		const result = await researchKeywords({
			keyword: "seo",
			language: "en",
			limit: 50,
			locations: [2840],
		});

		// Validate response format using zod
		const validatedResult = keywordIdeasResponseSchema.parse(result);

		expect(validatedResult).toBeDefined();
		expect(Array.isArray(validatedResult)).toBe(true);

		// If results exist, validate structure
		if (validatedResult.length > 0) {
			const firstResult = validatedResult[0];
			expect(firstResult).toHaveProperty("keyword");
			expect(firstResult).toHaveProperty("avgMonthlySearches");
			expect(firstResult).toHaveProperty("competition");
			expect(firstResult).toHaveProperty("competitionIndex");
			expect(firstResult).toHaveProperty("highTopOfPageBidMicros");
			expect(firstResult).toHaveProperty("lowTopOfPageBidMicros");
		}
	});

	test("should respect limit parameter", async () => {
		if (!hasCredentials()) {
			console.warn(
				"Skipping test: Google Ads credentials not configured. Set either:\n" +
					"  - OAuth: GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CUSTOMER_ID\n" +
					"  - Service Account: GOOGLE_ADS_SERVICE_ACCOUNT_PATH (or GOOGLE_APPLICATION_CREDENTIALS), GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CUSTOMER_ID",
			);
			return;
		}

		const limit = 5;
		const result = await researchKeywords({
			keyword: "advertising",
			language: "en",
			limit,
			locations: [2840],
		});

		// Validate response format using zod
		const validatedResult = keywordIdeasResponseSchema.parse(result);

		expect(validatedResult.length).toBeLessThanOrEqual(limit);
	});
});

describe("getKeywordMetrics", () => {
	test("should successfully get metrics for a list of keywords", async () => {
		if (!hasCredentials()) {
			console.warn(
				"Skipping test: Google Ads credentials not configured. Set either:\n" +
					"  - OAuth: GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CUSTOMER_ID\n" +
					"  - Service Account: GOOGLE_ADS_SERVICE_ACCOUNT_PATH (or GOOGLE_APPLICATION_CREDENTIALS), GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CUSTOMER_ID",
			);
			return;
		}

		const result = await getKeywordMetrics({
			keywords: ["marketing", "advertising", "seo"],
			language: "en",
			locations: [2840],
		});

		// Validate response format using zod
		const validatedResult = keywordIdeasResponseSchema.parse(result);

		expect(validatedResult).toBeDefined();
		expect(Array.isArray(validatedResult)).toBe(true);
		expect(validatedResult.length).toBeGreaterThan(0);

		// Validate each keyword metric
		for (const metric of validatedResult) {
			expect(metric.keyword).toBeDefined();
			expect(metric.keyword.length).toBeGreaterThan(0);
			expect(metric.avgMonthlySearches).toBeGreaterThanOrEqual(0);
			expect(["UNKNOWN", "LOW", "MEDIUM", "HIGH"]).toContain(
				metric.competition,
			);
			expect(metric.competitionIndex).toBeGreaterThanOrEqual(0);
			expect(metric.competitionIndex).toBeLessThanOrEqual(100);
			expect(metric.highTopOfPageBidMicros).toBeGreaterThanOrEqual(0);
			expect(metric.lowTopOfPageBidMicros).toBeGreaterThanOrEqual(0);
		}
	});

	test("should return results in correct format with default parameters", async () => {
		if (!hasCredentials()) {
			console.warn(
				"Skipping test: Google Ads credentials not configured. Set either:\n" +
					"  - OAuth: GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CUSTOMER_ID\n" +
					"  - Service Account: GOOGLE_ADS_SERVICE_ACCOUNT_PATH (or GOOGLE_APPLICATION_CREDENTIALS), GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CUSTOMER_ID",
			);
			return;
		}

		const result = await getKeywordMetrics({
			keywords: ["digital marketing"],
			language: "en",
			locations: [2840],
		});

		// Validate response format using zod
		const validatedResult = keywordIdeasResponseSchema.parse(result);

		expect(validatedResult).toBeDefined();
		expect(Array.isArray(validatedResult)).toBe(true);

		// If results exist, validate structure
		if (validatedResult.length > 0) {
			const firstResult = validatedResult[0];
			expect(firstResult).toHaveProperty("keyword");
			expect(firstResult).toHaveProperty("avgMonthlySearches");
			expect(firstResult).toHaveProperty("competition");
			expect(firstResult).toHaveProperty("competitionIndex");
			expect(firstResult).toHaveProperty("highTopOfPageBidMicros");
			expect(firstResult).toHaveProperty("lowTopOfPageBidMicros");
		}
	});

	test("should handle multiple keywords correctly", async () => {
		if (!hasCredentials()) {
			console.warn(
				"Skipping test: Google Ads credentials not configured. Set either:\n" +
					"  - OAuth: GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CUSTOMER_ID\n" +
					"  - Service Account: GOOGLE_ADS_SERVICE_ACCOUNT_PATH (or GOOGLE_APPLICATION_CREDENTIALS), GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CUSTOMER_ID",
			);
			return;
		}

		const keywords = [
			"content marketing",
			"social media marketing",
			"email marketing",
		];
		const result = await getKeywordMetrics({
			keywords,
			language: "en",
			locations: [2840],
		});

		// Validate response format using zod
		const validatedResult = keywordIdeasResponseSchema.parse(result);

		expect(validatedResult).toBeDefined();
		expect(Array.isArray(validatedResult)).toBe(true);
		// Should return metrics for at least some of the keywords
		expect(validatedResult.length).toBeGreaterThan(0);
	});
});
