import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
	addSearchParams,
	ensureLeadingSlash,
	isAbsoluteUrl,
	type QueryParameters,
	sanitizeQueryParameters,
	sanitizeSiteUrl,
} from "./index.pub.ts";

describe("sanitizeQueryParameters", () => {
	it("should filter out null and undefined values", () => {
		const params: QueryParameters = {
			age: null,
			city: undefined,
			country: "USA",
			name: "John",
		};
		const result = sanitizeQueryParameters(params);
		// URLSearchParams order is not guaranteed, so check individual values
		expect(result.get("name")).toBe("John");
		expect(result.get("country")).toBe("USA");
		expect(result.get("age")).toBe(null);
		expect(result.get("city")).toBe(null);
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

	it("should handle numeric string values", () => {
		const params: QueryParameters = {
			float: "3.14",
			negative: "-456",
			number: "123",
			zero: "0",
		};
		const result = sanitizeQueryParameters(params);
		expect(result.get("number")).toBe("123");
		expect(result.get("negative")).toBe("-456");
		expect(result.get("zero")).toBe("0");
		expect(result.get("float")).toBe("3.14");
	});

	it("should handle boolean string values", () => {
		const params: QueryParameters = {
			boolean: "yes",
			falseValue: "false",
			trueValue: "true",
		};
		const result = sanitizeQueryParameters(params);
		expect(result.get("trueValue")).toBe("true");
		expect(result.get("falseValue")).toBe("false");
		expect(result.get("boolean")).toBe("yes");
	});

	it("should handle very long parameter values", () => {
		const longValue = "a".repeat(1000);
		const params: QueryParameters = {
			long: longValue,
		};
		const result = sanitizeQueryParameters(params);
		expect(result.get("long")).toBe(longValue);
	});

	it("should handle parameters with special key names", () => {
		const params: QueryParameters = {
			"": "empty-key",
			"key with spaces": "value",
			key_with_underscores: "value",
			"key-with-dashes": "value",
			"key.with.dots": "value",
		};
		const result = sanitizeQueryParameters(params);
		expect(result.get("")).toBe("empty-key");
		expect(result.get("key with spaces")).toBe("value");
		expect(result.get("key-with-dashes")).toBe("value");
		expect(result.get("key_with_underscores")).toBe("value");
		expect(result.get("key.with.dots")).toBe("value");
	});

	it("should handle duplicate keys correctly", () => {
		const params: QueryParameters = {
			key: "second", // Only one key-value pair since object keys are unique
		};
		const result = sanitizeQueryParameters(params);
		expect(result.get("key")).toBe("second");
		expect(result.getAll("key")).toEqual(["second"]);
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

	it("should handle edge cases for protocol detection", () => {
		// Edge cases that might be confusing
		expect(isAbsoluteUrl("http://")).toBe(true);
		expect(isAbsoluteUrl("https://")).toBe(true);
		expect(isAbsoluteUrl("HTTP://example.com")).toBe(true);
		expect(isAbsoluteUrl("HTTPS://example.com")).toBe(true);
		expect(isAbsoluteUrl("http:///")).toBe(true);
		expect(isAbsoluteUrl("https:///")).toBe(true);

		// Invalid but similar patterns
		expect(isAbsoluteUrl("http:/example.com")).toBe(false);
		expect(isAbsoluteUrl("https:/example.com")).toBe(false);
		expect(isAbsoluteUrl("http:example.com")).toBe(false);
		expect(isAbsoluteUrl("https:example.com")).toBe(false);
	});

	it("should handle URLs with unusual ports", () => {
		expect(isAbsoluteUrl("http://example.com:8080")).toBe(true);
		expect(isAbsoluteUrl("https://example.com:8443")).toBe(true);
		expect(isAbsoluteUrl("http://example.com:65535")).toBe(true);
		expect(isAbsoluteUrl("http://example.com:1")).toBe(true);
	});

	it("should handle URLs with authentication", () => {
		expect(isAbsoluteUrl("http://user:pass@example.com")).toBe(true);
		expect(isAbsoluteUrl("https://user@example.com")).toBe(true);
		expect(isAbsoluteUrl("http://:pass@example.com")).toBe(true);
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
		// URLSearchParams order is not guaranteed, so check URL components
		const urlObj = new URL(result);
		expect(urlObj.origin + urlObj.pathname).toBe("https://example.com/page");
		expect(urlObj.searchParams.get("name")).toBe("John");
		expect(urlObj.searchParams.get("age")).toBe("30");
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
		// URLSearchParams order is not guaranteed, so check URL components
		const urlObj = new URL(result, "https://example.com");
		expect(urlObj.pathname).toBe("/page");
		expect(urlObj.searchParams.get("name")).toBe("John");
	});

	it("should handle URLs with existing hash fragments", () => {
		const url = "https://example.com/page#section";
		const params: QueryParameters = { name: "John" };
		const result = addSearchParams(url, params);
		expect(result).toContain("#section");
		expect(result).toContain("name=John");
	});

	it("should handle URLs with existing hash fragments for relative URLs", () => {
		const url = "/page#section";
		const params: QueryParameters = { name: "John" };
		const result = addSearchParams(url, params);
		expect(result).toBe("/page?name=John#section");
	});

	it("should handle multiple parameters with same key (overwrites)", () => {
		const url = "https://example.com/page";
		const params: QueryParameters = {
			age: "30",
			name: "Jane", // Only one name since object keys are unique
		};
		const result = addSearchParams(url, params);
		const urlObj = new URL(result);
		expect(urlObj.searchParams.get("name")).toBe("Jane");
		expect(urlObj.searchParams.get("age")).toBe("30");
	});

	it("should handle URLs with very long paths", () => {
		const longPath = `/${"a".repeat(1000)}`;
		const url = `https://example.com${longPath}`;
		const params: QueryParameters = { name: "John" };
		const result = addSearchParams(url, params);
		const urlObj = new URL(result);
		expect(urlObj.pathname).toBe(longPath);
		expect(urlObj.searchParams.get("name")).toBe("John");
	});

	it("should handle international domain names", () => {
		const url = "https://例え.テスト/path";
		const params: QueryParameters = { name: "John" };
		const result = addSearchParams(url, params);
		// International domain names get converted to punycode
		expect(result).toContain("xn--r8jz45g.xn--zckzah");
		expect(result).toContain("name=John");
	});

	it("should handle URLs with existing parameters and hash", () => {
		const url = "https://example.com/page?existing=value#section";
		const params: QueryParameters = { new: "param" };
		const result = addSearchParams(url, params);
		const urlObj = new URL(result);
		expect(urlObj.searchParams.get("existing")).toBe("value");
		expect(urlObj.searchParams.get("new")).toBe("param");
		expect(urlObj.hash).toBe("#section");
	});

	it("should handle empty string URLs", () => {
		const url = "";
		const params: QueryParameters = { name: "John" };
		const result = addSearchParams(url, params);
		expect(result).toBe("/?name=John");
	});

	it("should handle URLs with only query parameters", () => {
		const url = "?existing=value";
		const params: QueryParameters = { new: "param" };
		const result = addSearchParams(url, params);
		const urlObj = new URL(result, "https://example.com");
		expect(urlObj.searchParams.get("existing")).toBe("value");
		expect(urlObj.searchParams.get("new")).toBe("param");
	});

	it("should handle URLs with only hash", () => {
		const url = "#section";
		const params: QueryParameters = { name: "John" };
		const result = addSearchParams(url, params);
		expect(result).toBe("/?name=John#section");
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

	it("should handle URLs with authentication in different origin", () => {
		const url = "https://user:pass@malicious.com/path";
		expect(sanitizeSiteUrl(url, origin).toString()).toBe(
			"https://example.com/path",
		);
	});

	it("should handle URLs with ports in different origin", () => {
		const url = "https://malicious.com:8080/path";
		expect(sanitizeSiteUrl(url, origin).toString()).toBe(
			"https://example.com/path",
		);
	});

	it("should handle very long relative paths", () => {
		const longPath = `/${"a".repeat(1000)}`;
		expect(sanitizeSiteUrl(longPath, origin).toString()).toBe(
			`https://example.com${longPath}`,
		);
	});

	it("should handle relative URLs with complex query parameters", () => {
		const url = "/path?param1=value1&param2=value2&param3=value3#fragment";
		expect(sanitizeSiteUrl(url, origin).toString()).toBe(
			"https://example.com/path?param1=value1&param2=value2&param3=value3#fragment",
		);
	});

	it("should handle URLs with encoded characters", () => {
		const url = "/path%20with%20spaces?param=value%20with%20spaces";
		expect(sanitizeSiteUrl(url, origin).toString()).toBe(
			"https://example.com/path%20with%20spaces?param=value%20with%20spaces",
		);
	});

	it("should handle URLs with mixed case protocols", () => {
		const url = "HTTPS://example.com/path";
		expect(sanitizeSiteUrl(url, origin).toString()).toBe(
			"https://example.com/path",
		);
	});

	it("should handle URLs with subdomains in same origin", () => {
		const url = "https://subdomain.example.com/path";
		expect(sanitizeSiteUrl(url, origin).toString()).toBe(
			"https://example.com/path",
		);
	});

	it("should handle URLs with www prefix in same origin", () => {
		const url = "https://www.example.com/path";
		expect(sanitizeSiteUrl(url, origin).toString()).toBe(
			"https://example.com/path",
		);
	});

	it("should handle URLs with trailing slashes", () => {
		const url = "/path/";
		expect(sanitizeSiteUrl(url, origin).toString()).toBe(
			"https://example.com/path/",
		);
	});

	it("should handle URLs with multiple slashes", () => {
		const url = "/path//to///page";
		expect(sanitizeSiteUrl(url, origin).toString()).toBe(
			"https://example.com/path//to///page",
		);
	});

	it("should handle URLs with dot segments", () => {
		const url = "/path/./to/../page";
		expect(sanitizeSiteUrl(url, origin).toString()).toBe(
			"https://example.com/path/page",
		);
	});

	it("should handle URLs with special characters in path", () => {
		const url = "/path/with/special-chars_here";
		expect(sanitizeSiteUrl(url, origin).toString()).toBe(
			"https://example.com/path/with/special-chars_here",
		);
	});

	it("should handle malformed URLs with missing host", () => {
		const url = "https:///path";
		expect(sanitizeSiteUrl(url, origin).toString()).toBe(
			"https://example.com/",
		);
	});

	it("should handle URLs with null bytes", () => {
		const url = "/path\x00with\x00nulls";
		expect(sanitizeSiteUrl(url, origin).toString()).toBe(
			"https://example.com/path%00with%00nulls",
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

	it("should handle URLs with encoded characters", () => {
		expect(ensureLeadingSlash("path%20with%20spaces")).toBe(
			"/path%20with%20spaces",
		);
		expect(ensureLeadingSlash("path%2Fwith%2Fslashes")).toBe(
			"/path%2Fwith%2Fslashes",
		);
	});

	it("should handle URLs with multiple slashes", () => {
		expect(ensureLeadingSlash("path//to///page")).toBe("/path//to///page");
		expect(ensureLeadingSlash("//path")).toBe("//path");
	});

	it("should handle URLs with dot segments", () => {
		expect(ensureLeadingSlash("./path")).toBe("/./path");
		expect(ensureLeadingSlash("../path")).toBe("/../path");
		expect(ensureLeadingSlash("path/./to/../page")).toBe("/path/./to/../page");
	});

	it("should handle URLs with trailing slashes", () => {
		expect(ensureLeadingSlash("path/")).toBe("/path/");
		expect(ensureLeadingSlash("path/to/")).toBe("/path/to/");
	});

	it("should handle URLs with special characters in names", () => {
		expect(ensureLeadingSlash("file-name")).toBe("/file-name");
		expect(ensureLeadingSlash("file_name")).toBe("/file_name");
		expect(ensureLeadingSlash("file.name")).toBe("/file.name");
		expect(ensureLeadingSlash("file+name")).toBe("/file+name");
	});

	it("should handle URLs with control characters", () => {
		expect(ensureLeadingSlash("path\x00with\x00nulls")).toBe(
			"/path\x00with\x00nulls",
		);
		expect(ensureLeadingSlash("path\twith\ttabs")).toBe("/path\twith\ttabs");
		expect(ensureLeadingSlash("path\nwith\nnewlines")).toBe(
			"/path\nwith\nnewlines",
		);
	});

	it("should handle very long URLs", () => {
		const longUrl = "a".repeat(1000);
		expect(ensureLeadingSlash(longUrl)).toBe(`/${longUrl}`);
	});

	it("should handle URLs with unicode characters", () => {
		expect(ensureLeadingSlash("🚀")).toBe("/🚀");
		expect(ensureLeadingSlash("🎉")).toBe("/🎉");
		expect(ensureLeadingSlash("café-ño")).toBe("/café-ño");
	});

	it("should handle edge cases", () => {
		expect(ensureLeadingSlash(".")).toBe("/.");
		expect(ensureLeadingSlash("..")).toBe("/..");
		expect(ensureLeadingSlash("...")).toBe("/...");
	});
});
