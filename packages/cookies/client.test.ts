import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { z } from "zod/v4";
import {
	deleteCookie,
	getCookie,
	getCookies,
	setCookie,
	setCookieSimple,
} from "./client.pub.ts";

// Mock document.cookie
let mockCookieString = "";

// Create a mock document object
const mockDocument = {
	get cookie() {
		return mockCookieString;
	},
	set cookie(value: string) {
		mockCookieString = value;
	},
};

// Mock global document
Object.defineProperty(globalThis, "document", {
	value: mockDocument,
	writable: true,
});

// Create Zod schemas for testing
const stringSchema = z.string().min(1);
const numberSchema = z.coerce.number();
const enumSchema = z.enum(["light", "dark"]);

describe("Client Cookies", () => {
	beforeEach(() => {
		mockCookieString = "";
	});

	afterEach(() => {
		mockCookieString = "";
	});

	describe("getCookies", () => {
		it("should return empty object when no cookies", () => {
			const cookies = getCookies();
			expect(cookies).toEqual({});
		});

		it("should parse simple cookies", () => {
			mockCookieString = "name=value; other=123";
			const cookies = getCookies();
			expect(cookies).toEqual({
				name: {
					httpOnly: false,
					secure: false,
					value: "value",
				},
				other: {
					httpOnly: false,
					secure: false,
					value: "123",
				},
			});
		});

		it("should parse cookies with validation", () => {
			mockCookieString = "valid=test; invalid=";
			const cookies = getCookies();
			expect(cookies).toEqual({
				valid: {
					httpOnly: false,
					secure: false,
					value: "test",
				},
			});
		});

		it("should parse number cookies with validation", () => {
			mockCookieString = "count=42; invalid=abc";
			const cookies = getCookies();
			expect(cookies).toEqual({
				count: {
					httpOnly: false,
					secure: false,
					value: "42",
				},
				invalid: {
					httpOnly: false,
					secure: false,
					value: "abc",
				},
			});
		});

		it("should parse enum cookies with validation", () => {
			mockCookieString = "theme=dark; invalid=blue";
			const cookies = getCookies();
			expect(cookies).toEqual({
				invalid: {
					httpOnly: false,
					secure: false,
					value: "blue",
				},
				theme: {
					httpOnly: false,
					secure: false,
					value: "dark",
				},
			});
		});
	});

	describe("getCookie", () => {
		it("should return undefined for non-existent cookie", () => {
			const cookie = getCookie("nonexistent");
			expect(cookie).toBeUndefined();
		});

		it("should return specific cookie", () => {
			mockCookieString = "name=value; other=123";
			const cookie = getCookie("name");
			expect(cookie).toEqual({
				httpOnly: false,
				secure: false,
				value: "value",
			});
		});

		it("should return cookie with validation", () => {
			mockCookieString = "count=42";
			const cookie = getCookie("count", numberSchema);
			expect(cookie).toEqual({
				httpOnly: false,
				secure: false,
				value: 42,
			});
		});

		it("should return undefined for invalid cookie with validation", () => {
			mockCookieString = "count=abc";
			const cookie = getCookie("count", numberSchema);
			expect(cookie).toBeUndefined();
		});
	});

	describe("setCookie", () => {
		it("should set simple cookie", () => {
			setCookie("test", { value: "hello" });
			expect(mockCookieString).toBe("test=hello");
		});

		it("should set cookie with options", () => {
			const expires = new Date("2024-01-01");
			setCookie("test", {
				expires,
				httpOnly: true,
				path: "/",
				sameSite: "Strict",
				secure: true,
				value: "hello",
			});
			expect(mockCookieString).toContain("test=hello");
			expect(mockCookieString).toContain("Expires=");
			expect(mockCookieString).toContain("Path=/");
			expect(mockCookieString).toContain("Secure");
			expect(mockCookieString).toContain("HttpOnly");
			expect(mockCookieString).toContain("SameSite=Strict");
		});

		it("should validate cookie value with schema", () => {
			setCookie("test", { schema: stringSchema, value: "valid" });
			expect(mockCookieString).toBe("test=valid");
		});

		it("should throw error for invalid cookie value", () => {
			expect(() => {
				setCookie("test", { schema: stringSchema, value: "" });
			}).toThrow(
				"Invalid cookie value: Too small: expected string to have >=1 characters",
			);
		});

		it("should validate number cookie value", () => {
			setCookie("count", { schema: numberSchema, value: 42 });
			expect(mockCookieString).toBe("count=42");
		});

		it("should validate enum cookie value", () => {
			setCookie("theme", { schema: enumSchema, value: "dark" });
			expect(mockCookieString).toBe("theme=dark");
		});

		it("should throw error for invalid enum value", () => {
			expect(() => {
				setCookie("theme", { schema: enumSchema, value: "blue" });
			}).toThrow(
				'Invalid cookie value: Invalid option: expected one of "light"|"dark"',
			);
		});
	});

	describe("setCookieSimple", () => {
		it("should set cookie with simple value", () => {
			setCookieSimple("test", "hello");
			expect(mockCookieString).toBe("test=hello");
		});

		it("should set cookie with options", () => {
			setCookieSimple("test", "hello", { path: "/", secure: true });
			expect(mockCookieString).toContain("test=hello");
			expect(mockCookieString).toContain("Path=/");
			expect(mockCookieString).toContain("Secure");
		});
	});

	describe("deleteCookie", () => {
		it("should delete cookie by setting expired date", () => {
			deleteCookie("test");
			expect(mockCookieString).toContain("test=");
			expect(mockCookieString).toContain("Expires=");
		});

		it("should delete cookie with path", () => {
			deleteCookie("test", { path: "/" });
			expect(mockCookieString).toContain("test=");
			expect(mockCookieString).toContain("Expires=");
			expect(mockCookieString).toContain("Path=/");
		});
	});

	describe("URL encoding", () => {
		it("should handle URL encoded values", () => {
			mockCookieString = "name=hello%20world";
			const cookies = getCookies();
			expect(cookies.name?.value).toBe("hello world");
		});

		it("should URL encode values when setting", () => {
			setCookie("test", { value: "hello world" });
			expect(mockCookieString).toBe("test=hello%20world");
		});
	});
});
