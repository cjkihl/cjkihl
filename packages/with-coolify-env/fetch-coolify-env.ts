/**
 * Represents an environment variable from Coolify
 */
export interface CoolifyEnv {
	/** The environment variable key/name */
	key: string;
	/** The environment variable value */
	value: string;
}

/**
 * Fetches environment variables from a Coolify instance
 *
 * This function makes an authenticated API request to Coolify to retrieve
 * environment variables for a specific application. The response is expected
 * to be a JSON array of objects with `key` and `value` properties.
 *
 * @param endpoint - The Coolify API endpoint URL (e.g., "https://coolify.example.com")
 * @param appId - The Coolify application ID to fetch environment variables for
 * @param token - The Coolify API token for authentication
 * @returns A promise that resolves to an array of environment variables
 *
 * @example
 * ```typescript
 * const envs = await fetchCoolifyEnvs(
 *   "https://coolify.example.com",
 *   "my-app-id",
 *   "my-api-token"
 * );
 *
 * for (const env of envs) {
 *   console.log(`${env.key}=${env.value}`);
 * }
 * ```
 *
 * @throws {Error} When required parameters (endpoint, appId, token) are missing
 * @throws {Error} When the API request fails or returns a non-OK status
 * @throws {Error} When the response cannot be parsed as JSON
 */
export async function fetchCoolifyEnvs(
	endpoint: string | undefined,
	appId: string | undefined,
	token: string | undefined,
): Promise<CoolifyEnv[]> {
	// Validate required parameters
	if (!endpoint || !token || !appId) {
		const missingParams = [];
		if (!endpoint) missingParams.push("endpoint");
		if (!appId) missingParams.push("appId");
		if (!token) missingParams.push("token");

		throw new Error(
			`Missing required Coolify configuration: ${missingParams.join(", ")}. ` +
				"Please provide these values either in the config or as environment variables " +
				"(COOLIFY_ENDPOINT, COOLIFY_APP_ID, COOLIFY_TOKEN).",
		);
	}

	// Construct the API URL
	const url = `${endpoint}/api/v1/applications/${appId}/envs`;
	console.log(`Fetching environment variables from Coolify at ${url}`);

	// Prepare request headers
	const headers = {
		Authorization: `Bearer ${token}`,
		"Content-Type": "application/json",
	};

	try {
		// Make the API request
		const response = await fetch(url, {
			headers,
			method: "GET",
			// Add timeout for better error handling
			signal: AbortSignal.timeout(30000), // 30 second timeout
		});

		const text = await response.text();

		// Check if the request was successful
		if (!response.ok) {
			throw new Error(
				"Failed to fetch environment variables from Coolify: " +
					`HTTP ${response.status} ${response.statusText}\n` +
					`Response: ${text}`,
			);
		}

		// Parse the JSON response
		try {
			const parsed = JSON.parse(text) as CoolifyEnv[];

			// Validate the response structure
			if (!Array.isArray(parsed)) {
				throw new Error(
					"Invalid response format: expected an array of environment variables",
				);
			}

			// Filter out invalid entries
			const validEnvs = parsed.filter(
				(env) =>
					env && typeof env.key === "string" && typeof env.value === "string",
			);

			console.log(
				`Successfully loaded ${validEnvs.length} environment variables from Coolify`,
			);
			return validEnvs;
		} catch (parseError) {
			throw new Error(
				`Failed to parse Coolify API response as JSON: ${parseError}\n` +
					`Response: ${text}`,
			);
		}
	} catch (error) {
		// Handle network errors and other exceptions
		if (error instanceof Error) {
			if (error.name === "AbortError") {
				throw new Error("Request to Coolify API timed out after 30 seconds");
			}
			throw new Error(
				`Error fetching Coolify environment variables: ${error.message}`,
			);
		}
		throw new Error(
			`Unexpected error fetching Coolify environment variables: ${error}`,
		);
	}
}
