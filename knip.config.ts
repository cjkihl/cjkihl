import type { KnipConfig } from "knip";

const config: KnipConfig = {
	project: ["**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}!"],
	workspaces: {
		"packages/*": {
			entry: ["**/*.{pub,bin,test,d,config}.{ts,tsx}", "**/examples/**"],
		},
	},
};

export default config;
