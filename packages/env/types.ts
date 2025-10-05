import type { z } from "zod/v4";

type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

export type Merge<T1, T2> = Prettify<Omit<T1, keyof T2> & T2>;

type EnvTuple = readonly [
	validator: z.ZodType<unknown, unknown>,
	value?: string,
];

export type EnvConfig = {
	name: string;
	description?: string;
	env: {
		[key: string]: EnvTuple;
	};
	skipValidation?: boolean;
};

export type MetaData = {
	[group: string]: {
		d?: string; // Description
		v: {
			// Values
			[key: string]: {
				c?: string; // Comment
				def?: string; // Default value
				o?: boolean; // Optional
			};
		};
	};
};

export type Environment<T extends EnvConfig> = Prettify<{
	[K in ExtractEnvKeys<T>]: ExtractEnvValue<T, K>;
}>;

type ExtractEnvValue<
	T extends EnvConfig,
	K extends ExtractEnvKeys<T>,
> = z.infer<T["env"][K][0]>;

type ExtractEnvKeys<T extends EnvConfig> = keyof T["env"];
