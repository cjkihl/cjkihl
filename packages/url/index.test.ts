import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
	addSearchParams,
	ensureLeadingSlash,
	isAbsoluteUrl,
	type QueryParameters,
	sanitizeQueryParameters,
	sanitizeSiteUrl,
} from "./index.pub";

describe("sanitizeQueryParameters", () => {
	it("should filter out null and undefined values", () => {
		const params: QueryParameters = {
			age: null,
			city: undefined,
			country: "USA",
			name: "John",
		};
		const result = sanitizeQueryParameters(params);
		expect(result.toString()).toBe("name=John&country=USA");
	});

	it("should handle empty object", () => {
		const params: QueryParameters = {};
		const result = sanitizeQueryParameters(params);
		expect(result.toString()).toBe("");
	});

	it("should handle object with only null/undefined values", () => {
		const params: QueryParameters = {
			nullValue: null,
			undefinedValue: undefined,
		};
		const result = sanitizeQueryParameters(params);
		expect(result.toString()).toBe("");
	});

	it("should handle special characters in values", () => {
		const params: QueryParameters = {
			search: "hello world",
			symbol: "test&value=test",
			unicode: "café",
		};
		const result = sanitizeQueryParameters(params);
		expect(result.get("search")).toBe("hello world");
		expect(result.get("symbol")).toBe("test&value=test");
		expect(result.get("unicode")).toBe("café");
	});

	it("should handle empty string values", () => {
		const params: QueryParameters = {
			empty: "",
			notEmpty: "value",
		};
		const result = sanitizeQueryParameters(params);
		expect(result.get("empty")).toBe("");
		expect(result.get("notEmpty")).toBe("value");
	});
});

describe("isAbsoluteUrl", () => {
	it("should return true for HTTP URLs", () => {
		expect(isAbsoluteUrl("http://example.com")).toBe(true);
		expect(isAbsoluteUrl("http://localhost:3000")).toBe(true);
		expect(isAbsoluteUrl("http://subdomain.example.com/path")).toBe(true);
	});

	it("should return true for HTTPS URLs", () => {
		expect(isAbsoluteUrl("https://example.com")).toBe(true);
		expect(isAbsoluteUrl("https://localhost:3000")).toBe(true);
		expect(isAbsoluteUrl("https://subdomain.example.com/path")).toBe(true);
	});

	it("should return false for relative URLs", () => {
		expect(isAbsoluteUrl("/path")).toBe(false);
		expect(isAbsoluteUrl("path")).toBe(false);
		expect(isAbsoluteUrl("../path")).toBe(false);
		expect(isAbsoluteUrl("./path")).toBe(false);
	});

	it("should return false for other protocols", () => {
		expect(isAbsoluteUrl("ftp://example.com")).toBe(false);
		expect(isAbsoluteUrl("file:///path")).toBe(false);
		expect(isAbsoluteUrl("ws://example.com")).toBe(false);
		expect(isAbsoluteUrl("wss://example.com")).toBe(false);
	});

	it("should return false for invalid inputs", () => {
		expect(isAbsoluteUrl("")).toBe(false);
		expect(isAbsoluteUrl("not a url")).toBe(false);
		// @ts-expect-error Testing non-string input
		expect(isAbsoluteUrl(null)).toBe(false);
		// @ts-expect-error Testing non-string input
		expect(isAbsoluteUrl(undefined)).toBe(false);
		// @ts-expect-error Testing non-string input
		expect(isAbsoluteUrl(123)).toBe(false);
	});
});

describe("addSearchParams", () => {
	// Mock window.location for testing
	const originalLocation = globalThis.location;
	beforeEach(() => {
		Object.defineProperty(globalThis, "location", {
			value: {
				origin: "https://example.com",
			},
			writable: true,
		});
	});

	afterEach(() => {
		Object.defineProperty(globalThis, "location", {
			value: originalLocation,
			writable: true,
		});
	});

	it("should add parameters to absolute URL", () => {
		const url = "https://example.com/page";
		const params: QueryParameters = { age: "30", name: "John" };
		const result = addSearchParams(url, params);
		expect(result).toBe("https://example.com/page?name=John&age=30");
	});

	it("should add parameters to relative URL", () => {
		const url = "/page";
		const params: QueryParameters = { name: "John" };
		const result = addSearchParams(url, params);
		expect(result).toBe("/page?name=John");
	});

	it("should preserve existing parameters", () => {
		const url = "https://example.com/page?existing=value";
		const params: QueryParameters = { new: "param" };
		const result = addSearchParams(url, params);
		expect(result).toBe("https://example.com/page?existing=value&new=param");
	});

	it("should update existing parameters with same key", () => {
		const url = "https://example.com/page?name=old";
		const params: QueryParameters = { name: "new" };
		const result = addSearchParams(url, params);
		expect(result).toBe("https://example.com/page?name=new");
	});

	it("should filter out null and undefined parameters", () => {
		const url = "https://example.com/page";
		const params: QueryParameters = {
			nullValue: null,
			undefinedValue: undefined,
			valid: "value",
		};
		const result = addSearchParams(url, params);
		expect(result).toBe("https://example.com/page?valid=value");
	});

	it("should handle URL without existing parameters", () => {
		const url = "https://example.com/page";
		const params: QueryParameters = { name: "John" };
		const result = addSearchParams(url, params);
		expect(result).toBe("https://example.com/page?name=John");
	});

	it("should handle special characters in parameters", () => {
		const url = "https://example.com/page";
		const params: QueryParameters = {
			search: "hello world",
			symbol: "test&value=test",
		};
		const result = addSearchParams(url, params);
		expect(result).toContain("search=hello+world");
		expect(result).toContain("symbol=test%26value%3Dtest");
	});

	it("should handle empty parameters object", () => {
		const url = "https://example.com/page";
		const params: QueryParameters = {};
		const result = addSearchParams(url, params);
		expect(result).toBe("https://example.com/page");
	});

	it("should handle relative URL without leading slash", () => {
		const url = "page";
		const params: QueryParameters = { name: "John" };
		const result = addSearchParams(url, params);
		expect(result).toBe("/page?name=John");
	});
});

describe("sanitizeSiteUrl", () => {
	const origin = "https://example.com";

	it("should return the full URL if the origin is valid and URL is absolute", () => {
		const url = "https://example.com/path/to/page";
		expect(sanitizeSiteUrl(url, origin).toString()).toBe(url);
	});

	it("should replace the origin if the URL is absolute and the origin is different", () => {
		const url = "https://different.com/path/to/page?query=param";
		expect(sanitizeSiteUrl(url, origin).toString()).toBe(
			"https://example.com/path/to/page?query=param",
		);
	});

	it("should append the relative URL to the origin", () => {
		const url = "/path/to/page";
		expect(sanitizeSiteUrl(url, origin).toString()).toBe(
			"https://example.com/path/to/page",
		);
	});

	it("should append the relative URL to the origin and add a slash if missing", () => {
		const url = "path/to/page";
		expect(sanitizeSiteUrl(url, origin).toString()).toBe(
			"https://example.com/path/to/page",
		);
	});

	it("should handle relative URLs with query parameters", () => {
		const url = "/path/to/page?query=param";
		expect(sanitizeSiteUrl(url, origin).toString()).toBe(
			"https://example.com/path/to/page?query=param",
		);
	});

	it("should handle relative URLs with no leading slash and query parameters", () => {
		const url = "path/to/page?query=param";
		expect(sanitizeSiteUrl(url, origin).toString()).toBe(
			"https://example.com/path/to/page?query=param",
		);
	});

	it("should handle invalid URLs by appending to the origin", () => {
		const url = "invalid-url";
		expect(sanitizeSiteUrl(url, origin).toString()).toBe(
			"https://example.com/invalid-url",
		);
	});

	it("should handle empty string URL", () => {
		const url = "";
		expect(sanitizeSiteUrl(url, origin).toString()).toBe(
			"https://example.com/",
		);
	});

	it("should handle URLs with fragments", () => {
		const url = "/path#section";
		expect(sanitizeSiteUrl(url, origin).toString()).toBe(
			"https://example.com/path#section",
		);
	});

	it("should handle absolute URLs with fragments from different origin", () => {
		const url = "https://malicious.com/path#section";
		expect(sanitizeSiteUrl(url, origin).toString()).toBe(
			"https://example.com/path#section",
		);
	});

	it("should handle URLs with complex query parameters", () => {
		const url = "/path?param1=value1&param2=value2&param3=value3";
		expect(sanitizeSiteUrl(url, origin).toString()).toBe(
			"https://example.com/path?param1=value1&param2=value2&param3=value3",
		);
	});

	it("should handle malformed absolute URLs", () => {
		const url = "https://";
		expect(sanitizeSiteUrl(url, origin).toString()).toBe(
			"https://example.com/",
		);
	});

	it("should handle URLs with special characters", () => {
		const url = "/path with spaces/émojis/测试";
		expect(sanitizeSiteUrl(url, origin).toString()).toBe(
			"https://example.com/path%20with%20spaces/%C3%A9mojis/%E6%B5%8B%E8%AF%95",
		);
	});

	it("should preserve search parameters when stripping different origin", () => {
		const url = "https://malicious.com/path?safe=param&dangerous=param";
		expect(sanitizeSiteUrl(url, origin).toString()).toBe(
			"https://example.com/path?safe=param&dangerous=param",
		);
	});
});

describe("ensureLeadingSlash", () => {
	it("should add leading slash to URLs without one", () => {
		expect(ensureLeadingSlash("page")).toBe("/page");
		expect(ensureLeadingSlash("path/to/page")).toBe("/path/to/page");
		expect(ensureLeadingSlash("")).toBe("/");
	});

	it("should not modify URLs that already have leading slash", () => {
		expect(ensureLeadingSlash("/page")).toBe("/page");
		expect(ensureLeadingSlash("/path/to/page")).toBe("/path/to/page");
		expect(ensureLeadingSlash("/")).toBe("/");
	});

	it("should handle URLs with query parameters", () => {
		expect(ensureLeadingSlash("page?query=param")).toBe("/page?query=param");
		expect(ensureLeadingSlash("/page?query=param")).toBe("/page?query=param");
	});

	it("should handle URLs with fragments", () => {
		expect(ensureLeadingSlash("page#section")).toBe("/page#section");
		expect(ensureLeadingSlash("/page#section")).toBe("/page#section");
	});

	it("should handle complex URLs", () => {
		expect(ensureLeadingSlash("path/to/page?query=param#section")).toBe(
			"/path/to/page?query=param#section",
		);
		expect(ensureLeadingSlash("/path/to/page?query=param#section")).toBe(
			"/path/to/page?query=param#section",
		);
	});

	it("should handle special characters", () => {
		expect(ensureLeadingSlash("café")).toBe("/café");
		expect(ensureLeadingSlash("测试")).toBe("/测试");
		expect(ensureLeadingSlash("path with spaces")).toBe("/path with spaces");
	});
});
