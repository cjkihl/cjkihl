import { describe, expect, it } from "bun:test";
import { z } from "zod/v4";
import {
	createCookie,
	parseCookieString,
	stringifyCookie,
	validateCookieValue,
} from "./utils.pub";

// Create Zod schemas for testing
const stringSchema = z.string().min(1);
const numberSchema = z.coerce.number();
const enumSchema = z.enum(["light", "dark"]);

describe("Utils", () => {
	describe("parseCookieString", () => {
		it("should parse empty string", () => {
			const cookies = parseCookieString("");
			expect(cookies).toEqual({});
		});

		it("should parse simple cookies", () => {
			const cookies = parseCookieString("name=value; other=123");
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

		it("should handle malformed cookies", () => {
			const cookies = parseCookieString("name=; other=123; =value");
			expect(cookies).toEqual({
				other: {
					httpOnly: false,
					secure: false,
					value: "123",
				},
			});
		});

		it("should parse with validation", () => {
			const cookies = parseCookieString("valid=test; invalid=");
			expect(cookies).toEqual({
				valid: {
					httpOnly: false,
					secure: false,
					value: "test",
				},
			});
		});

		it("should parse number cookies with validation", () => {
			const cookies = parseCookieString("count=42; invalid=abc");
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
			const cookies = parseCookieString("theme=dark; invalid=blue");
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

	describe("stringifyCookie", () => {
		it("should stringify simple cookie", () => {
			const cookie = {
				httpOnly: false,
				secure: false,
				value: "test",
			};
			const result = stringifyCookie("name", cookie);
			expect(result).toBe("name=test");
		});

		it("should stringify cookie with all options", () => {
			const expires = new Date("2024-01-01T00:00:00Z");
			const cookie = {
				domain: "example.com",
				expires,
				httpOnly: true,
				maxAge: 3600,
				path: "/",
				sameSite: "Strict" as const,
				secure: true,
				value: "test",
			};
			const result = stringifyCookie("name", cookie);
			expect(result).toContain("name=test");
			expect(result).toContain("Expires=");
			expect(result).toContain("Max-Age=3600");
			expect(result).toContain("Domain=example.com");
			expect(result).toContain("Path=/");
			expect(result).toContain("Secure");
			expect(result).toContain("HttpOnly");
			expect(result).toContain("SameSite=Strict");
		});

		it("should handle non-string values", () => {
			const cookie = {
				httpOnly: false,
				secure: false,
				value: 42,
			};
			const result = stringifyCookie("count", cookie);
			expect(result).toBe("count=42");
		});
	});

	describe("validateCookieValue", () => {
		it("should validate successful value", () => {
			const result = validateCookieValue("valid", stringSchema);
			expect(result.success).toBe(true);
			expect(result.value).toBe("valid");
		});

		it("should validate failed value", () => {
			const result = validateCookieValue("", stringSchema);
			expect(result.success).toBe(false);
			expect(result.errors).toEqual([
				{
					message: "Too small: expected string to have >=1 characters",
					path: [],
				},
			]);
		});

		it("should handle number validation", () => {
			const result = validateCookieValue("42", numberSchema);
			expect(result.success).toBe(true);
			expect(result.value).toBe(42);
		});

		it("should handle number validation failure", () => {
			const result = validateCookieValue("abc", numberSchema);
			expect(result.success).toBe(false);
			expect(result.errors).toEqual([
				{ message: "Invalid input: expected number, received NaN", path: [] },
			]);
		});

		it("should handle enum validation", () => {
			const result = validateCookieValue("dark", enumSchema);
			expect(result.success).toBe(true);
			expect(result.value).toBe("dark");
		});

		it("should handle enum validation failure", () => {
			const result = validateCookieValue("blue", enumSchema);
			expect(result.success).toBe(false);
			expect(result.errors).toEqual([
				{
					message: 'Invalid option: expected one of "light"|"dark"',
					path: [],
				},
			]);
		});
	});

	describe("createCookie", () => {
		it("should create simple cookie", () => {
			const cookie = createCookie({ value: "test" });
			expect(cookie).toEqual({
				httpOnly: false,
				secure: false,
				value: "test",
			});
		});

		it("should create cookie with options", () => {
			const expires = new Date("2024-01-01");
			const cookie = createCookie({
				expires,
				httpOnly: true,
				path: "/",
				sameSite: "Strict",
				secure: true,
				value: "test",
			});
			expect(cookie).toEqual({
				expires,
				httpOnly: true,
				path: "/",
				sameSite: "Strict",
				secure: true,
				value: "test",
			});
		});

		it("should validate cookie value with schema", () => {
			const cookie = createCookie({ schema: stringSchema, value: "valid" });
			expect(cookie.value).toBe("valid");
		});

		it("should throw error for invalid cookie value", () => {
			expect(() => {
				createCookie({ schema: stringSchema, value: "" });
			}).toThrow(
				"Invalid cookie value: Too small: expected string to have >=1 characters",
			);
		});

		it("should validate number cookie value", () => {
			const cookie = createCookie({ schema: numberSchema, value: 42 });
			expect(cookie.value).toBe(42);
		});

		it("should validate enum cookie value", () => {
			const cookie = createCookie({ schema: enumSchema, value: "dark" });
			expect(cookie.value).toBe("dark");
		});

		it("should throw error for invalid enum value", () => {
			expect(() => {
				createCookie({ schema: enumSchema, value: "blue" });
			}).toThrow(
				'Invalid cookie value: Invalid option: expected one of "light"|"dark"',
			);
		});
	});
});
