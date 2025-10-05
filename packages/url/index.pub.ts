/**
 * Object representing query parameters where keys are strings and values can be strings, null, or undefined.
 * This type allows for flexible parameter handling while maintaining type safety.
 */
export type QueryParameters = {
	[key: string]: string | null | undefined;
};

/**
 * Sanitizes query parameters by filtering out null and undefined values.
 * Converts the resulting object to URLSearchParams for use in URLs.
 *
 * @param params - The query parameters object to sanitize
 * @returns A URLSearchParams object containing only defined string values
 *
 * @example
 * ```typescript
 * const params = { name: 'John', age: null, city: undefined, country: 'USA' };
 * const sanitized = sanitizeQueryParameters(params);
 * // Returns URLSearchParams with only: name=John, country=USA
 * ```
 */
export function sanitizeQueryParameters(
	params: QueryParameters,
): URLSearchParams {
	const filteredProps: Record<string, string> = {};
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== null) {
			filteredProps[key] = value;
		}
	}
	return new URLSearchParams(filteredProps);
}

/**
 * Checks if a URL is absolute (starts with http:// or https://).
 *
 * @param href - The URL string to check
 * @returns True if the URL is absolute, false otherwise
 *
 * @example
 * ```typescript
 * isAbsoluteUrl('https://example.com') // true
 * isAbsoluteUrl('http://localhost:3000') // true
 * isAbsoluteUrl('/relative/path') // false
 * isAbsoluteUrl('relative/path') // false
 * ```
 */
export function isAbsoluteUrl(href: string): boolean {
	if (typeof href === "string") {
		return /^https?:\/\//.test(href);
	}
	return false;
}

/**
 * Adds search parameters to a URL, preserving existing parameters and handling both absolute and relative URLs.
 * For relative URLs, it uses the current window location origin as the base.
 *
 * @param url - The URL to add parameters to (can be absolute or relative)
 * @param params - The query parameters to add
 * @returns The URL with the added search parameters
 *
 * @example
 * ```typescript
 * // With absolute URL
 * addSearchParams('https://example.com/page', { name: 'John', age: '30' })
 * // Returns: 'https://example.com/page?name=John&age=30'
 *
 * // With relative URL
 * addSearchParams('/page', { name: 'John' })
 * // Returns: '/page?name=John' (assuming window.location.origin is used)
 *
 * // Preserves existing parameters
 * addSearchParams('/page?existing=value', { new: 'param' })
 * // Returns: '/page?existing=value&new=param'
 * ```
 */
export function addSearchParams(url: string, params: QueryParameters): string {
	// Check if the URL is absolute
	const isAbsolute = isAbsoluteUrl(url);
	const baseUrl = isAbsolute ? url : window.location.origin + url;

	const urlObject = new URL(baseUrl);
	const searchParams = new URLSearchParams(urlObject.search);

	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== null) {
			searchParams.set(key, value);
		}
	}

	// Update the URL object with the new search parameters
	urlObject.search = searchParams.toString();

	// Return the relative or absolute URL with updated search parameters
	return isAbsolute
		? urlObject.toString()
		: urlObject.pathname + urlObject.search;
}

/**
 * Sanitizes a URL to ensure it is safe for use within a specific site origin.
 * Converts relative URLs to absolute URLs using the provided origin.
 * For absolute URLs with different origins, it strips the origin and uses the provided one.
 *
 * @param url - The URL to sanitize (can be absolute or relative)
 * @param origin - The allowed origin for the URL (e.g., 'https://example.com')
 * @returns A URL object that is guaranteed to be within the specified origin
 *
 * @example
 * ```typescript
 * // Relative URL
 * sanitizeSiteUrl('/page', 'https://example.com')
 * // Returns: URL('https://example.com/page')
 *
 * // Absolute URL with same origin
 * sanitizeSiteUrl('https://example.com/page', 'https://example.com')
 * // Returns: URL('https://example.com/page')
 *
 * // Absolute URL with different origin
 * sanitizeSiteUrl('https://malicious.com/page', 'https://example.com')
 * // Returns: URL('https://example.com/page')
 *
 * // Invalid URL fallback
 * sanitizeSiteUrl('not-a-url', 'https://example.com')
 * // Returns: URL('https://example.com/not-a-url')
 * ```
 */
export const sanitizeSiteUrl = (url: string, origin: string): URL => {
	try {
		if (!isAbsoluteUrl(url)) {
			return new URL(origin + ensureLeadingSlash(url));
		}
		const fullUrl = new URL(url);
		if (fullUrl.origin !== origin) {
			return new URL(origin + fullUrl.pathname + fullUrl.search);
		}
		return fullUrl;
	} catch (_e) {
		return new URL(origin + ensureLeadingSlash(url));
	}
};

/**
 * Ensures a URL string starts with a leading slash.
 *
 * @param url - The URL string to check
 * @returns The URL with a leading slash
 *
 * @example
 * ```typescript
 * ensureLeadingSlash('page') // '/page'
 * ensureLeadingSlash('/page') // '/page'
 * ensureLeadingSlash('') // '/'
 * ```
 */
export const ensureLeadingSlash = (url: string): string =>
	url.startsWith("/") ? url : `/${url}`;
