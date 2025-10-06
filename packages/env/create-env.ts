import { pickBy } from "remeda";
import { z } from "zod/v4";
import type { EnvConfig, Environment, MetaData } from "./types.ts";

/**
 * Creates a type-safe environment configuration object
 *
 * @template T - The environment configuration type
 * @param {T} config - The configuration object containing environment variables and their schemas
 * @returns {Environment<T>} A validated environment object with metadata
 *
 * @example
 * ```ts
 * const env = createEnv({
 *   name: 'app',
 *   description: 'Application environment',
 *   env: {
 *     VITE_API_KEY: [z.string(), process.env.VITE_API_KEY]
 *   }
 * });
 * ```
 */
export function createEnv<T extends EnvConfig>(config: T): Environment<T> {
	const env = {} as { _meta?: MetaData } & Record<string, unknown>;

	// biome-ignore lint/complexity/useLiteralKeys: process.env is an index signature
	if (!config.skipValidation && !process.env["SKIP_ENV_VALIDATION"])
		for (const [key, [schema, compiledValue]] of Object.entries(config.env)) {
			let value: string | undefined;

			// Handle different environment contexts (browser vs server)
			if (typeof window !== "undefined") {
				if (key.startsWith("VITE_")) {
					value = compiledValue;
				} else if (key.startsWith("NEXT_PUBLIC_")) {
					value = compiledValue;
				} else {
					// Skip server-only vars in browser context
					continue;
				}
			} else {
				// Server context - can access all env vars
				value = process.env[key];
			}

			// Validate the environment variable against its schema
			const parsed = schema.safeParse(value);
			if (!parsed.success) {
				throw new Error(
					`Invalid value for environment variable ${key}: ${value} ${parsed.error.message}`,
				);
			}
			env[key] = parsed.data;
		}

	// Add metadata to the environment object
	env._meta = createMetaData(config);
	return env as Environment<T>;
}

/**
 * Extracts default values from a Zod schema
 *
 * @param {z.ZodTypeAny} value - The Zod schema to extract defaults from
 */
function getDefaults(value: z.ZodTypeAny) {
	try {
		if (value instanceof z.ZodDefault) {
			const defaultValue = value.def.defaultValue;
			return typeof defaultValue === "function" ? defaultValue() : defaultValue;
		}
		return undefined;
	} catch (_e) {
		return undefined;
	}
}

/**
 * Creates metadata for the environment configuration
 * Includes descriptions, optionality, and default values
 *
 * @param {EnvConfig} config - The environment configuration
 * @returns {MetaData} Metadata object containing variable information
 */
function createMetaData(config: EnvConfig): MetaData {
	const meta: MetaData = {
		[config.name]: {
			d: config.description ?? "",
			v: {},
		},
	};

	// Process each environment variable
	for (const [key, [schema, _]] of Object.entries(config.env)) {
		const def = getDefaults(schema);
		// Store variable metadata, filtering out undefined values
		meta[config.name]!.v[key] = pickBy(
			{
				c: schema.description, // Variable description
				def: typeof def === "string" ? def : undefined, // Default value if any
				o: schema.safeParse(undefined).success ? true : undefined, // Is optional?
			},
			(v) => v !== undefined,
		);
	}
	return meta;
}
