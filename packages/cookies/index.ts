/**
 * @cj/cookies - A minimal, type-safe cookies library with Standard Schema validation support
 *
 * @example
 * ```typescript
 * // Client-side usage
 * import { getCookies, setCookie } from "@cj/cookies/client";
 *
 * // Server-side usage
 * import { getCookies, setCookie } from "@cj/cookies/server";
 *
 * // Types and utilities
 * import type { Cookie, CookieOptions } from "@cj/cookies/types";
 * import { parseCookieString, stringifyCookie } from "@cj/cookies/utils";
 * ```
 */

// Re-export client functions with aliases
export {
	deleteCookie as deleteClientCookie,
	getCookie as getClientCookie,
	getCookies as getClientCookies,
	setCookie as setClientCookie,
	setCookieSimple as setClientCookieSimple,
} from "./client.pub";

// Re-export server functions with aliases
export {
	deleteCookie as deleteServerCookie,
	getCookie as getServerCookie,
	getCookies as getServerCookies,
	setCookie as setServerCookie,
	setCookieSimple as setServerCookieSimple,
} from "./server.pub";

// Re-export types
export * from "./types.pub";

// Re-export utilities
export * from "./utils.pub";
