import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { Cookie, CookieOptions, CookieRecord } from "./types.pub.ts";
import {
	createCookie,
	parseCookieString,
	stringifyCookie,
	validateCookieValue,
} from "./utils.pub.ts";

/**
 * Gets all cookies from a Request or Headers object.
 * Returns raw string values - use getCookie for individual validation.
 *
 * @param req - The Request object or Headers object containing cookies
 * @returns A record of cookie objects keyed by cookie name with raw string values
 *
 * @example
 * ```typescript
 * // From Request object
 * const cookies = getCookies(request);
 *
 * // From Headers object
 * const cookies = getCookies(request.headers);
 * ```
 */
export function getCookies(req: Request | Headers): CookieRecord<string> {
	const headers = "headers" in req ? req.headers : req;
	const cookieHeader = headers.get("cookie");
	return cookieHeader ? parseCookieString(cookieHeader) : {};
}

/**
 * Gets a specific cookie by name from a Request or Headers object.
 * Optionally validates the cookie value against a schema.
 *
 * @param req - The Request object or Headers object containing cookies
 * @param key - The name of the cookie to retrieve
 * @param schema - Optional Standard Schema for validating the cookie value
 * @returns The cookie object if found and valid, undefined otherwise
 *
 * @example
 * ```typescript
 * // From Request object
 * const session = getCookie(request, "session");
 *
 * // From Headers object
 * const session = getCookie(request.headers, "session");
 *
 * // With validation
 * const schema = z.string().min(1); // Zod schema
 * const session = getCookie(request, "session", schema);
 * ```
 */
export function getCookie<T = string>(
	req: Request | Headers,
	key: string,
	schema?: StandardSchemaV1<T>,
): Cookie<T> | undefined {
	const cookies = getCookies(req);
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
 * Sets a cookie on a Response or Headers object with full options and optional validation.
 *
 * @param res - The Response object or Headers object to set the cookie on
 * @param key - The name of the cookie
 * @param options - The cookie options including value and optional attributes
 *
 * @example
 * ```typescript
 * // On Response object
 * setCookie(response, "session", {
 *   value: "abc123",
 *   expires: new Date("2024-12-31"),
 *   path: "/",
 *   secure: true,
 *   httpOnly: true,
 *   sameSite: "Strict"
 * });
 *
 * // On Headers object
 * setCookie(headers, "session", { value: "abc123" });
 *
 * // With validation
 * const schema = z.string().min(1);
 * setCookie(response, "user", {
 *   value: "john",
 *   schema
 * });
 * ```
 */
export function setCookie<T = string>(
	res: Response | Headers,
	key: string,
	options: CookieOptions<T>,
): void {
	const cookie = createCookie(options);
	const headers = "headers" in res ? res.headers : res;
	headers.append("Set-Cookie", stringifyCookie(key, cookie));
}

/**
 * Sets a cookie on a Response or Headers object with a simple value and optional attributes.
 *
 * @param res - The Response object or Headers object to set the cookie on
 * @param key - The name of the cookie
 * @param value - The value to store in the cookie
 * @param options - Optional cookie attributes (excluding value)
 *
 * @example
 * ```typescript
 * // On Response object
 * setCookieSimple(response, "theme", "dark");
 *
 * // On Headers object
 * setCookieSimple(headers, "theme", "dark");
 *
 * // With options
 * setCookieSimple(response, "session", "abc123", {
 *   expires: new Date("2024-12-31"),
 *   path: "/",
 *   secure: true
 * });
 * ```
 */
export function setCookieSimple<T = string>(
	res: Response | Headers,
	key: string,
	value: T,
	options?: Omit<CookieOptions<T>, "value">,
): void {
	setCookie(res, key, { value, ...options });
}

/**
 * Deletes a cookie on a Response or Headers object by setting its expiration date to the past.
 *
 * @param res - The Response object or Headers object to delete the cookie from
 * @param key - The name of the cookie to delete
 * @param options - Optional path and domain for the deletion
 *
 * @example
 * ```typescript
 * // On Response object
 * deleteCookie(response, "session");
 *
 * // On Headers object
 * deleteCookie(headers, "session");
 *
 * // With specific path
 * deleteCookie(response, "session", { path: "/" });
 *
 * // With path and domain
 * deleteCookie(response, "session", { path: "/", domain: "example.com" });
 * ```
 */
export function deleteCookie(
	res: Response | Headers,
	key: string,
	options?: { path?: string; domain?: string },
): void {
	const expires = new Date(0);
	setCookie(res, key, {
		domain: options?.domain,
		expires,
		path: options?.path,
		value: "",
	});
}
