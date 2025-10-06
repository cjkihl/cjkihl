import type { Merge } from "./types.ts";

type MergeArrayOfObjects<
	TArr extends readonly object[],
	T1 = object,
> = TArr extends [infer T2 extends object, ...infer TRest extends object[]]
	? MergeArrayOfObjects<TRest, Merge<T1, T2>>
	: T1;

/**
 * Merges multiple environment objects into a single object.
 * Special handling for _meta key to combine configuration groups.
 *
 * @example
 * ```ts
 * const env1 = {
 *   _meta: { group1: { v: {} } },
 *   VAR1: "value1"
 * };
 *
 * const env2 = {
 *   _meta: { group2: { v: {} } },
 *   VAR2: "value2"
 * };
 *
 * const merged = mergeEnvs(env1, env2);
 * // Result:
 * // {
 * //   _meta: {
 * //     group1: { v: {} },
 * //     group2: { v: {} }
 * //   },
 * //   VAR1: "value1",
 * //   VAR2: "value2"
 * // }
 * ```
 *
 * @param objects - Environment objects to merge
 * @returns A single merged environment object
 *
 * @remarks
 * - _meta objects are merged recursively to combine configuration groups
 * - Other keys are overwritten by later objects in the array
 * - Type safety is maintained through MergeArrayOfObjects type
 */
export const mergeEnvs = <TArr extends readonly object[]>(
	...objects: TArr
): MergeArrayOfObjects<TArr> => {
	const result = {} as Record<string, unknown>;
	for (const current of objects) {
		const c = current as Record<string, unknown>;
		for (const key in current) {
			if (
				key === "_meta" &&
				typeof result[key] === "object" &&
				typeof c[key] === "object"
			) {
				result[key] = { ...result[key], ...c[key] };
			} else {
				result[key] = c[key];
			}
		}
	}
	return result as MergeArrayOfObjects<TArr>;
};
