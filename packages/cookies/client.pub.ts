import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { Cookie, CookieOptions, CookieRecord } from "./types.pub.js";
import {
	createCookie,
	parseCookieString,
	stringifyCookie,
	validateCookieValue,
} from "./utils.pub.js";

/**
 * Gets all cookies from the browser's document.cookie.
 * Returns raw string values - use getCookie for individual validation.
 *
 * @returns A record of cookie objects keyed by cookie name with raw string values
 *
 * @example
 * ```typescript
 * const cookies = getCookies();
 * // Returns all cookies as raw strings
 * ```
 */
export function getCookies(): CookieRecord<string> {
	return parseCookieString(document.cookie);
}

/**
 * Gets a specific cookie by name from the browser's document.cookie.
 * Optionally validates the cookie value against a schema.
 *
 * @param key - The name of the cookie to retrieve
 * @param schema - Optional Standard Schema for validating the cookie value
 * @returns The cookie object if found and valid, undefined otherwise
 *
 * @example
 * ```typescript
 * // Get cookie without validation
 * const theme = getCookie("theme");
 *
 * // Get cookie with validation
 * const schema = z.enum(["light", "dark"]); // Zod schema
 * const theme = getCookie("theme", schema);
 * ```
 */
export function getCookie<T = string>(
	key: string,
	schema?: StandardSchemaV1<T>,
): Cookie<T> | undefined {
	const cookies = getCookies();
	const cookie = cookies[key];

	if (!cookie) {
		return undefined;
	}

	// If no schema provided, return as-is (type assertion)
	if (!schema) {
		return cookie as Cookie<T>;
	}

	// Validate the cookie value
	const validation = validateCookieValue(cookie.value, schema);
	if (!validation.success) {
		return undefined;
	}

	return {
		...cookie,
		value: validation.value!,
	};
}

/**
 * Sets a cookie in the browser with full options and optional validation.
 *
 * @param key - The name of the cookie
 * @param options - The cookie options including value and optional attributes
 *
 * @example
 * ```typescript
 * // Set simple cookie
 * setCookie("theme", { value: "dark" });
 *
 * // Set cookie with full options
 * setCookie("session", {
 *   value: "abc123",
 *   expires: new Date("2024-12-31"),
 *   path: "/",
 *   secure: true,
 *   httpOnly: false,
 *   sameSite: "Strict"
 * });
 *
 * // Set cookie with validation
 * const schema = z.string().min(1);
 * setCookie("user", {
 *   value: "john",
 *   schema
 * });
 * ```
 */
export function setCookie<T = string>(
	key: string,
	options: CookieOptions<T>,
): void {
	const cookie = createCookie(options);
	// biome-ignore lint/suspicious/noDocumentCookie: We need to set the cookie on the document
	document.cookie = stringifyCookie(key, cookie);
}

/**
 * Sets a cookie in the browser with a simple value and optional attributes.
 *
 * @param key - The name of the cookie
 * @param value - The value to store in the cookie
 * @param options - Optional cookie attributes (excluding value)
 *
 * @example
 * ```typescript
 * // Set simple cookie
 * setCookieSimple("theme", "dark");
 *
 * // Set cookie with options
 * setCookieSimple("session", "abc123", {
 *   expires: new Date("2024-12-31"),
 *   path: "/",
 *   secure: true
 * });
 * ```
 */
export function setCookieSimple<T = string>(
	key: string,
	value: T,
	options?: Omit<CookieOptions<T>, "value">,
): void {
	setCookie(key, { value, ...options });
}

/**
 * Deletes a cookie by setting its expiration date to the past.
 *
 * @param key - The name of the cookie to delete
 * @param options - Optional path and domain for the deletion
 *
 * @example
 * ```typescript
 * // Delete cookie
 * deleteCookie("session");
 *
 * // Delete cookie with specific path
 * deleteCookie("session", { path: "/" });
 *
 * // Delete cookie with path and domain
 * deleteCookie("session", { path: "/", domain: "example.com" });
 * ```
 */
export function deleteCookie(
	key: string,
	options?: { path?: string; domain?: string },
): void {
	const expires = new Date(0);
	setCookie(key, {
		domain: options?.domain,
		expires,
		path: options?.path,
		value: "",
	});
}
