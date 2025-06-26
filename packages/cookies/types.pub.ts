import type { StandardSchemaV1 } from "@standard-schema/spec";

export interface Cookie<T = string> {
	/** The value stored in the cookie */
	value: T;

	/** Expiration date of the cookie. Max-Age takes precedence if both present */
	expires?: Date;

	/** Number of seconds until the cookie expires */
	maxAge?: number;

	/** Host to which the cookie will be sent */
	domain?: string;

	/** Path on the server for which the cookie is valid */
	path?: string;

	/** Indicates if cookie is only transmitted over HTTPS */
	secure: boolean;

	/** Prevents client-side access to cookie through JavaScript */
	httpOnly: boolean;

	/** Controls how cookie is sent in cross-site requests
	 * - 'Strict': Only sent in first-party context
	 * - 'Lax': Sent in first-party context and top-level navigation
	 * - 'None': Sent in all contexts (requires secure=true)
	 */
	sameSite?: "Strict" | "Lax" | "None";
}

export interface CookieOptions<T = string> {
	/** The value to store in the cookie */
	value: T;
	/** Expiration date of the cookie. Max-Age takes precedence if both present */
	expires?: Date;
	/** Number of seconds until the cookie expires */
	maxAge?: number;
	/** Host to which the cookie will be sent */
	domain?: string;
	/** Path on the server for which the cookie is valid */
	path?: string;
	/** Indicates if cookie is only transmitted over HTTPS */
	secure?: boolean;
	/** Prevents client-side access to cookie through JavaScript */
	httpOnly?: boolean;
	/** Controls how cookie is sent in cross-site requests */
	sameSite?: "Strict" | "Lax" | "None";
	/** Schema for validating cookie values */
	schema?: StandardSchemaV1<T>;
}

export interface CookieValidationResult<T> {
	/** Whether the validation was successful */
	success: boolean;
	/** The validated value if successful */
	value?: T;
	/** Validation errors if unsuccessful */
	errors?: Array<{ message: string; path?: string[] }>;
}

export type CookieRecord<T = string> = Record<string, Cookie<T>>;
