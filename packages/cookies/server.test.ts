import { describe, expect, it } from "bun:test";
import { z } from "zod/v4";
import {
	deleteCookie,
	getCookie,
	getCookies,
	setCookie,
	setCookieSimple,
} from "./server.pub";

// Create Zod schemas for testing
const stringSchema = z.string().min(1);
const numberSchema = z.coerce.number();
const enumSchema = z.enum(["light", "dark"]);

describe("Server Cookies", () => {
	describe("getCookies", () => {
		it("should return empty object when no cookies", () => {
			const headers = new Headers();
			const cookies = getCookies(headers);
			expect(cookies).toEqual({});
		});

		it("should parse cookies from Headers", () => {
			const headers = new Headers();
			headers.set("cookie", "name=value; other=123");
			const cookies = getCookies(headers);
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

		it("should parse cookies from Request", () => {
			const headers = new Headers();
			headers.set("cookie", "name=value; other=123");
			const request = new Request("http://example.com", { headers });
			const cookies = getCookies(request);
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
			const headers = new Headers();
			headers.set("cookie", "valid=test; invalid=");
			const cookies = getCookies(headers);
			expect(cookies).toEqual({
				valid: {
					httpOnly: false,
					secure: false,
					value: "test",
				},
			});
		});

		it("should parse number cookies with validation", () => {
			const headers = new Headers();
			headers.set("cookie", "count=42; invalid=abc");
			const cookies = getCookies(headers);
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
			const headers = new Headers();
			headers.set("cookie", "theme=dark; invalid=blue");
			const cookies = getCookies(headers);
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
			const headers = new Headers();
			const cookie = getCookie(headers, "nonexistent");
			expect(cookie).toBeUndefined();
		});

		it("should return specific cookie from Headers", () => {
			const headers = new Headers();
			headers.set("cookie", "name=value; other=123");
			const cookie = getCookie(headers, "name");
			expect(cookie).toEqual({
				httpOnly: false,
				secure: false,
				value: "value",
			});
		});

		it("should return specific cookie from Request", () => {
			const headers = new Headers();
			headers.set("cookie", "name=value; other=123");
			const request = new Request("http://example.com", { headers });
			const cookie = getCookie(request, "name");
			expect(cookie).toEqual({
				httpOnly: false,
				secure: false,
				value: "value",
			});
		});

		it("should return cookie with validation", () => {
			const headers = new Headers();
			headers.set("cookie", "count=42");
			const cookie = getCookie(headers, "count", numberSchema);
			expect(cookie).toEqual({
				httpOnly: false,
				secure: false,
				value: 42,
			});
		});

		it("should return undefined for invalid cookie with validation", () => {
			const headers = new Headers();
			headers.set("cookie", "count=abc");
			const cookie = getCookie(headers, "count", numberSchema);
			expect(cookie).toBeUndefined();
		});
	});

	describe("setCookie", () => {
		it("should set cookie on Headers", () => {
			const headers = new Headers();
			setCookie(headers, "test", { value: "hello" });
			expect(headers.get("Set-Cookie")).toBe("test=hello");
		});

		it("should set cookie on Response", () => {
			const response = new Response();
			setCookie(response, "test", { value: "hello" });
			expect(response.headers.get("Set-Cookie")).toBe("test=hello");
		});

		it("should set cookie with options", () => {
			const headers = new Headers();
			const expires = new Date("2024-01-01");
			setCookie(headers, "test", {
				expires,
				httpOnly: true,
				path: "/",
				sameSite: "Strict",
				secure: true,
				value: "hello",
			});
			const cookieHeader = headers.get("Set-Cookie");
			expect(cookieHeader).toContain("test=hello");
			expect(cookieHeader).toContain("Expires=");
			expect(cookieHeader).toContain("Path=/");
			expect(cookieHeader).toContain("Secure");
			expect(cookieHeader).toContain("HttpOnly");
			expect(cookieHeader).toContain("SameSite=Strict");
		});

		it("should append multiple cookies", () => {
			const headers = new Headers();
			setCookie(headers, "first", { value: "1" });
			setCookie(headers, "second", { value: "2" });
			expect(headers.getAll("Set-Cookie")).toEqual(["first=1", "second=2"]);
		});

		it("should validate cookie value with schema", () => {
			const headers = new Headers();
			setCookie(headers, "test", { schema: stringSchema, value: "valid" });
			expect(headers.get("Set-Cookie")).toBe("test=valid");
		});

		it("should throw error for invalid cookie value", () => {
			const headers = new Headers();
			expect(() => {
				setCookie(headers, "test", { schema: stringSchema, value: "" });
			}).toThrow(
				"Invalid cookie value: Too small: expected string to have >=1 characters",
			);
		});

		it("should validate number cookie value", () => {
			const headers = new Headers();
			setCookie(headers, "count", { schema: numberSchema, value: 42 });
			expect(headers.get("Set-Cookie")).toBe("count=42");
		});

		it("should validate enum cookie value", () => {
			const headers = new Headers();
			setCookie(headers, "theme", { schema: enumSchema, value: "dark" });
			expect(headers.get("Set-Cookie")).toBe("theme=dark");
		});

		it("should throw error for invalid enum value", () => {
			const headers = new Headers();
			expect(() => {
				setCookie(headers, "theme", { schema: enumSchema, value: "blue" });
			}).toThrow(
				'Invalid cookie value: Invalid option: expected one of "light"|"dark"',
			);
		});
	});

	describe("setCookieSimple", () => {
		it("should set cookie with simple value", () => {
			const headers = new Headers();
			setCookieSimple(headers, "test", "hello");
			expect(headers.get("Set-Cookie")).toBe("test=hello");
		});

		it("should set cookie with options", () => {
			const headers = new Headers();
			setCookieSimple(headers, "test", "hello", { path: "/", secure: true });
			const cookieHeader = headers.get("Set-Cookie");
			expect(cookieHeader).toContain("test=hello");
			expect(cookieHeader).toContain("Path=/");
			expect(cookieHeader).toContain("Secure");
		});
	});

	describe("deleteCookie", () => {
		it("should delete cookie by setting expired date", () => {
			const headers = new Headers();
			deleteCookie(headers, "test");
			const cookieHeader = headers.get("Set-Cookie");
			expect(cookieHeader).toContain("test=");
			expect(cookieHeader).toContain("Expires=");
		});

		it("should delete cookie with path", () => {
			const headers = new Headers();
			deleteCookie(headers, "test", { path: "/" });
			const cookieHeader = headers.get("Set-Cookie");
			expect(cookieHeader).toContain("test=");
			expect(cookieHeader).toContain("Expires=");
			expect(cookieHeader).toContain("Path=/");
		});
	});

	describe("URL encoding", () => {
		it("should handle URL encoded values", () => {
			const headers = new Headers();
			headers.set("cookie", "name=hello%20world");
			const cookies = getCookies(headers);
			expect(cookies.name?.value).toBe("hello world");
		});

		it("should URL encode values when setting", () => {
			const headers = new Headers();
			setCookie(headers, "test", { value: "hello world" });
			expect(headers.get("Set-Cookie")).toBe("test=hello%20world");
		});
	});
});
