import type { KnipConfig } from "knip";

const config: KnipConfig = {
	ignoreFiles: ["packages/skills/**/scripts/**"],
	ignoreIssues: {
		"packages/mcp-google-ads/dist/**": ["unlisted"],
		"packages/mcp-google-ads/reference/**": ["unlisted"],
	},
	project: ["**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}!"],
	workspaces: {
		"packages/*": {
			entry: ["**/*.{pub,bin,test,d,config}.{ts,tsx}", "**/examples/**"],
		},
		"packages/mcp-google-ads": {
			entry: [
				"**/*.{pub,bin,test,d,config}.{ts,tsx}",
				"**/examples/**",
				"test-auth.ts",
				"validate-credentials.ts",
				"reference/**",
			],
			ignoreDependencies: ["open"],
		},
	},
};
export default config;
