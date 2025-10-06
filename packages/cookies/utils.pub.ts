import type { StandardSchemaV1 } from "@standard-schema/spec";
import type {
	Cookie,
	CookieOptions,
	CookieRecord,
	CookieValidationResult,
} from "./types.pub.ts";

/**
 * Parses a cookie string and returns a record of cookie objects with raw string values.
 * This function does NOT validate cookies - use validateCookieValue for individual validation.
 *
 * @param cookieStr - The cookie string to parse (e.g., "name=value; other=123")
 * @returns A record of cookie objects keyed by cookie name with raw string values
 *
 * @example
 * ```typescript
 * const cookies = parseCookieString("name=value; other=123");
 * // Returns: { name: { value: "value", ... }, other: { value: "123", ... } }
 * ```
 */
export function parseCookieString(cookieStr: string): CookieRecord<string> {
	const cookies: CookieRecord<string> = {};

	for (const cookie of cookieStr.split(";")) {
		const [key, ...parts] = cookie.trim().split("=");
		const value = parts.join("=");

		// Only include cookies with a non-empty, trimmed key and non-empty value
		if (key && key.trim().length > 0 && value !== undefined && value !== "") {
			const decodedValue = decodeURIComponent(value);
			cookies[key] = {
				httpOnly: false,
				secure: false,
				value: decodedValue,
			};
		}
	}
	return cookies;
}

/**
 * Converts a cookie object to a Set-Cookie header string.
 *
 * @param key - The cookie name
 * @param cookie - The cookie object to stringify
 * @returns A properly formatted Set-Cookie header string
 *
 * @example
 * ```typescript
 * const cookie = {
 *   value: "session123",
 *   expires: new Date("2024-12-31"),
 *   path: "/",
 *   secure: true,
 *   httpOnly: true,
 *   sameSite: "Strict"
 * };
 *
 * const header = stringifyCookie("session", cookie);
 * // "session=session123; Expires=Tue, 31 Dec 2024 00:00:00 GMT; Path=/; Secure; HttpOnly; SameSite=Strict"
 * ```
 */
export function stringifyCookie<T>(key: string, cookie: Cookie<T>): string {
	const parts = [`${key}=${encodeURIComponent(String(cookie.value))}`];
	if (cookie.expires) parts.push(`Expires=${cookie.expires.toUTCString()}`);
	if (cookie.maxAge) parts.push(`Max-Age=${cookie.maxAge}`);
	if (cookie.domain) parts.push(`Domain=${cookie.domain}`);
	if (cookie.path) parts.push(`Path=${cookie.path}`);
	if (cookie.secure) parts.push("Secure");
	if (cookie.httpOnly) parts.push("HttpOnly");
	if (cookie.sameSite) parts.push(`SameSite=${cookie.sameSite}`);

	return parts.join("; ");
}

/**
 * Validates a cookie value using a Standard Schema.
 *
 * @param value - The value to validate
 * @param schema - The Standard Schema to validate against
 * @returns A validation result object
 *
 * @example
 * ```typescript
 * const schema = z.string().min(1); // Zod schema
 * const result = validateCookieValue("hello", schema);
 *
 * if (result.success) {
 *   console.log("Valid value:", result.value);
 * } else {
 *   console.log("Validation errors:", result.errors);
 * }
 * ```
 */
export function validateCookieValue<T>(
	value: unknown,
	schema: StandardSchemaV1<T>,
): CookieValidationResult<T> {
	const result = schema["~standard"].validate(value);

	if (result instanceof Promise) {
		return {
			errors: [{ message: "Async validation not supported for cookies" }],
			success: false,
		};
	}

	if (result.issues) {
		return {
			errors: result.issues.map((issue) => ({
				message: issue.message,
				path: issue.path?.map((p) => String(p)),
			})),
			success: false,
		};
	}

	return {
		success: true,
		value: result.value,
	};
}

/**
 * Creates a cookie object from options, with optional validation.
 *
 * @param options - The cookie options including value and optional attributes
 * @returns A properly formatted cookie object
 * @throws {Error} If validation fails when a schema is provided
 *
 * @example
 * ```typescript
 * // Create without validation
 * const cookie = createCookie({
 *   value: "session123",
 *   expires: new Date("2024-12-31"),
 *   path: "/",
 *   secure: true
 * });
 *
 * // Create with validation
 * const schema = z.string().min(1);
 * const cookie = createCookie({
 *   value: "valid",
 *   schema
 * });
 * ```
 */
export function createCookie<T = string>(options: CookieOptions<T>): Cookie<T> {
	// Validate the value if schema is provided
	if (options.schema) {
		const validation = validateCookieValue(options.value, options.schema);
		if (!validation.success) {
			throw new Error(
				`Invalid cookie value: ${validation.errors?.map((e) => e.message).join(", ")}`,
			);
		}
	}

	return {
		domain: options.domain,
		expires: options.expires,
		httpOnly: options.httpOnly ?? false,
		maxAge: options.maxAge,
		path: options.path,
		sameSite: options.sameSite,
		secure: options.secure ?? false,
		value: options.value,
	};
}
