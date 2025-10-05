import { describe, expect, it } from "bun:test";
import { z } from "zod/v4";
import { createEnv } from "./create-env";
import createEnvFile from "./create-env-file.pub";
import { mergeEnvs } from "./merge-envs";

// Mock env vars
process.env.API_KEY = "test-key";
process.env.PORT = "3000";
process.env.SEARCH_SECRET = "";
process.env.SITE_URL = "https://url.com";
process.env.DEBUG = "true";

const server = createEnv({
	description: "Environment variables for the server",
	env: {
		API_KEY: [z.string().min(1)],
		OPTIONAL: [z.string().optional()],
		PORT: [z.string().min(1)],
		SEARCH_SECRET: [
			z
				.string()
				.describe(
					"Secret key for search. Mandatory for production. Can be empty for dev",
				),
		],
	},
	name: "Server",
});

const site = createEnv({
	description: "Environment variables for the website",
	env: {
		DEBUG: [z.string()],
		SITE_URL: [z.string().url()],
	},
	name: "Site",
});

const mergedEnv = mergeEnvs(server, site);

describe("createEnvFile", () => {
	describe("metadata", () => {
		it("should preserve metadata in individual environments", () => {
			// biome-ignore lint/suspicious/noExplicitAny: Meta is not typed
			expect((server as any)._meta).toEqual(
				expect.objectContaining({
					Server: expect.objectContaining({
						v: expect.objectContaining({
							API_KEY: expect.any(Object),
							PORT: expect.any(Object),
						}),
					}),
				}),
			);
		});

		it("should correctly merge metadata from multiple environments", () => {
			// biome-ignore lint/suspicious/noExplicitAny: Meta is not typed
			expect((mergedEnv as any)._meta).toEqual(
				expect.objectContaining({
					Server: expect.any(Object),
					Site: expect.any(Object),
				}),
			);
		});
	});

	describe("env file generation", () => {
		it("should generate file with correct sections and variables", () => {
			const result = createEnvFile("test-project", mergedEnv);

			// Header checks
			expect(result).toContain("Env file for test-project");
			expect(result).toContain("Don't forget to add to .gitignore");

			// Section checks
			expect(result).toContain("Server");
			expect(result).toContain("Site");

			// Variable checks
			expect(result).toMatch(/API_KEY=/);
			expect(result).toMatch(/PORT=/);
			expect(result).toMatch(/SITE_URL=/);
			expect(result).toMatch(/DEBUG=/);
			expect(result).toMatch(/OPTIONAL=/);
		});

		it("Optional variables should be commented out by default, unless they have a value", () => {
			const result = createEnvFile("test-project", mergedEnv);
			// Optional variables should be commented out by default, unless they have a value
			expect(result).toMatch(/# OPTIONAL=/);
		});

		it("Optional variables should be added if they have a value", () => {
			const result = createEnvFile("test-project", mergedEnv, {
				OPTIONAL: "test",
			});
			expect(result).toMatch(/OPTIONAL="test"/);
		});

		it("should preserve existing values", () => {
			const existingValues = {
				API_KEY: "test-key",
				SITE_URL: "https://test.com",
			};

			const result = createEnvFile("test-project", mergedEnv, existingValues);

			expect(result).toContain('API_KEY="test-key"');
			expect(result).toContain('SITE_URL="https://test.com"');
		});

		it("Should handle existing values that are not part of validation correctly", () => {
			const existingValues = {
				API_KEY: "test-key",
				OTHER: "other-value",
				SEARCH_SECRET: "",
				SITE_URL: "https://test.com",
			};
			const result = createEnvFile("test-project", mergedEnv, existingValues);
			expect(result).toMatch(/OTHER="other-value"/);
			expect(result).not.toContain('API_KEY="undefined"');
		});

		it("Empty values should not be added again under 'Other'", () => {
			const existingValues = {
				SEARCH_SECRET: "",
			};
			const result = createEnvFile("test-project", mergedEnv, existingValues);

			// Count occurrences of SEARCH_SECRET=""
			const matches = result.match(/SEARCH_SECRET=/g);
			expect(matches?.length).toBe(1);
		});
	});
});
