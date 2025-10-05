# @cjkihl/url

Type-safe URL manipulation utilities for query parameters, URL validation, and sanitization. Perfect for handling URLs in both browser and server environments with comprehensive type safety.

## Features

- 🔒 **Type-safe**: Full TypeScript support with proper type definitions
- 🧹 **Query parameter sanitization**: Filter out null/undefined values automatically
- 🌐 **Universal**: Works in both browser and server environments
- 🔍 **URL validation**: Check if URLs are absolute or relative
- 🛡️ **Security**: Sanitize URLs to prevent origin-based attacks
- ⚡ **Lightweight**: Zero dependencies, built on native Web APIs
- 🔧 **Flexible**: Handle both absolute and relative URLs seamlessly

## Installation

```bash
bun add @cjkihl/url
```

## Quick Start

### Basic Query Parameter Handling

```typescript
import { sanitizeQueryParameters, addSearchParams } from '@cjkihl/url';

// Sanitize query parameters (removes null/undefined values)
const params = {
  name: 'John',
  age: null,
  city: undefined,
  country: 'USA'
};

const sanitized = sanitizeQueryParameters(params);
console.log(sanitized.toString()); // "name=John&country=USA"

// Add parameters to URLs
const url = 'https://example.com/page';
const newUrl = addSearchParams(url, { name: 'John', age: '30' });
console.log(newUrl); // "https://example.com/page?name=John&age=30"
```

### URL Validation and Sanitization

```typescript
import { isAbsoluteUrl, sanitizeSiteUrl, ensureLeadingSlash } from '@cjkihl/url';

// Check if URL is absolute
console.log(isAbsoluteUrl('https://example.com')); // true
console.log(isAbsoluteUrl('/relative/path')); // false

// Sanitize URLs for security
const safeUrl = sanitizeSiteUrl('/user/profile', 'https://example.com');
console.log(safeUrl.toString()); // "https://example.com/user/profile"

// Ensure leading slash
console.log(ensureLeadingSlash('page')); // "/page"
console.log(ensureLeadingSlash('/page')); // "/page"
```

## API Reference

### `sanitizeQueryParameters(params: QueryParameters): URLSearchParams`

Sanitizes query parameters by filtering out null and undefined values, returning a URLSearchParams object.

#### Parameters

- `params`: Object with string keys and values that can be strings, null, or undefined

#### Returns

A URLSearchParams object containing only defined string values.

#### Example

```typescript
import { sanitizeQueryParameters } from '@cjkihl/url';

const params = {
  name: 'John',
  age: null,
  city: undefined,
  country: 'USA'
};

const sanitized = sanitizeQueryParameters(params);
console.log(sanitized.toString()); // "name=John&country=USA"
```

### `isAbsoluteUrl(href: string): boolean`

Checks if a URL is absolute (starts with http:// or https://).

#### Parameters

- `href`: The URL string to check

#### Returns

True if the URL is absolute, false otherwise.

#### Example

```typescript
import { isAbsoluteUrl } from '@cjkihl/url';

console.log(isAbsoluteUrl('https://example.com')); // true
console.log(isAbsoluteUrl('http://localhost:3000')); // true
console.log(isAbsoluteUrl('/relative/path')); // false
console.log(isAbsoluteUrl('relative/path')); // false
```

### `addSearchParams(url: string, params: QueryParameters): string`

Adds search parameters to a URL, preserving existing parameters and handling both absolute and relative URLs.

#### Parameters

- `url`: The URL to add parameters to (can be absolute or relative)
- `params`: The query parameters to add

#### Returns

The URL with the added search parameters.

#### Example

```typescript
import { addSearchParams } from '@cjkihl/url';

// With absolute URL
const absoluteUrl = addSearchParams('https://example.com/page', { 
  name: 'John', 
  age: '30' 
});
console.log(absoluteUrl); // "https://example.com/page?name=John&age=30"

// With relative URL
const relativeUrl = addSearchParams('/page', { name: 'John' });
console.log(relativeUrl); // "/page?name=John"

// Preserves existing parameters
const withExisting = addSearchParams('/page?existing=value', { new: 'param' });
console.log(withExisting); // "/page?existing=value&new=param"
```

### `sanitizeSiteUrl(url: string, origin: string): URL`

Sanitizes a URL to ensure it is safe for use within a specific site origin. Converts relative URLs to absolute URLs and strips different origins for security.

#### Parameters

- `url`: The URL to sanitize (can be absolute or relative)
- `origin`: The allowed origin for the URL (e.g., 'https://example.com')

#### Returns

A URL object that is guaranteed to be within the specified origin.

#### Example

```typescript
import { sanitizeSiteUrl } from '@cjkihl/url';

const origin = 'https://example.com';

// Relative URL
const relative = sanitizeSiteUrl('/page', origin);
console.log(relative.toString()); // "https://example.com/page"

// Absolute URL with same origin
const sameOrigin = sanitizeSiteUrl('https://example.com/page', origin);
console.log(sameOrigin.toString()); // "https://example.com/page"

// Absolute URL with different origin (security feature)
const differentOrigin = sanitizeSiteUrl('https://malicious.com/page', origin);
console.log(differentOrigin.toString()); // "https://example.com/page"

// Invalid URL fallback
const invalid = sanitizeSiteUrl('not-a-url', origin);
console.log(invalid.toString()); // "https://example.com/not-a-url"
```

### `ensureLeadingSlash(url: string): string`

Ensures a URL string starts with a leading slash.

#### Parameters

- `url`: The URL string to check

#### Returns

The URL with a leading slash.

#### Example

```typescript
import { ensureLeadingSlash } from '@cjkihl/url';

console.log(ensureLeadingSlash('page')); // "/page"
console.log(ensureLeadingSlash('/page')); // "/page"
console.log(ensureLeadingSlash('')); // "/"
```

## Types

### `QueryParameters`

```typescript
type QueryParameters = {
  [key: string]: string | null | undefined;
};
```

Represents query parameters where keys are strings and values can be strings, null, or undefined.

## Examples

### Building Search URLs

```typescript
import { addSearchParams, sanitizeQueryParameters } from '@cjkihl/url';

function buildSearchUrl(baseUrl: string, filters: Record<string, any>) {
  // Sanitize filters to remove null/undefined values
  const sanitizedFilters = sanitizeQueryParameters(filters);
  
  // Convert URLSearchParams back to object for addSearchParams
  const params: Record<string, string> = {};
  sanitizedFilters.forEach((value, key) => {
    params[key] = value;
  });
  
  return addSearchParams(baseUrl, params);
}

// Usage
const searchUrl = buildSearchUrl('/search', {
  query: 'typescript',
  category: 'programming',
  price: null, // Will be filtered out
  sort: 'relevance'
});

console.log(searchUrl); // "/search?query=typescript&category=programming&sort=relevance"
```

### URL Security in Web Applications

```typescript
import { sanitizeSiteUrl, isAbsoluteUrl } from '@cjkihl/url';

function createSafeRedirectUrl(userInput: string, allowedOrigin: string): string {
  // Check if it's an absolute URL
  if (isAbsoluteUrl(userInput)) {
    // Sanitize to ensure it's within our domain
    return sanitizeSiteUrl(userInput, allowedOrigin).toString();
  }
  
  // For relative URLs, just ensure leading slash
  return sanitizeSiteUrl(userInput, allowedOrigin).toString();
}

// Usage in a web application
const allowedOrigin = 'https://myapp.com';
const userRedirect = 'https://malicious.com/steal-data';
const safeRedirect = createSafeRedirectUrl(userRedirect, allowedOrigin);

console.log(safeRedirect); // "https://myapp.com/steal-data" (safe!)
```

### Form Data to URL Parameters

```typescript
import { sanitizeQueryParameters, addSearchParams } from '@cjkihl/url';

function formToUrlParams(formData: FormData, baseUrl: string): string {
  const params: Record<string, string | null | undefined> = {};
  
  // Convert FormData to object
  for (const [key, value] of formData.entries()) {
    params[key] = value.toString();
  }
  
  // Sanitize and add to URL
  const sanitized = sanitizeQueryParameters(params);
  const paramObject: Record<string, string> = {};
  sanitized.forEach((value, key) => {
    paramObject[key] = value;
  });
  
  return addSearchParams(baseUrl, paramObject);
}

// Usage
const form = new FormData();
form.append('name', 'John Doe');
form.append('email', 'john@example.com');
form.append('newsletter', ''); // Empty value

const url = formToUrlParams(form, '/contact');
console.log(url); // "/contact?name=John+Doe&email=john%40example.com"
```

### API Query Builder

```typescript
import { addSearchParams, sanitizeQueryParameters } from '@cjkihl/url';

class ApiQueryBuilder {
  private baseUrl: string;
  private params: Record<string, string | null | undefined> = {};

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  addParam(key: string, value: string | null | undefined): this {
    this.params[key] = value;
    return this;
  }

  addParams(params: Record<string, string | null | undefined>): this {
    Object.assign(this.params, params);
    return this;
  }

  build(): string {
    const sanitized = sanitizeQueryParameters(this.params);
    const paramObject: Record<string, string> = {};
    sanitized.forEach((value, key) => {
      paramObject[key] = value;
    });
    
    return addSearchParams(this.baseUrl, paramObject);
  }
}

// Usage
const apiUrl = new ApiQueryBuilder('https://api.example.com/users')
  .addParam('page', '1')
  .addParam('limit', '10')
  .addParam('search', 'john')
  .addParam('filter', null) // Will be filtered out
  .build();

console.log(apiUrl); // "https://api.example.com/users?page=1&limit=10&search=john"
```

### Next.js Router Integration

```typescript
import { addSearchParams, sanitizeQueryParameters } from '@cjkihl/url';
import { useRouter } from 'next/router';

function useSafeRouter() {
  const router = useRouter();

  const pushWithParams = (pathname: string, params: Record<string, any>) => {
    const sanitized = sanitizeQueryParameters(params);
    const paramObject: Record<string, string> = {};
    sanitized.forEach((value, key) => {
      paramObject[key] = value;
    });
    
    const url = addSearchParams(pathname, paramObject);
    router.push(url);
  };

  return { ...router, pushWithParams };
}

// Usage in a React component
function SearchPage() {
  const { pushWithParams } = useSafeRouter();

  const handleSearch = (filters: Record<string, any>) => {
    pushWithParams('/search', {
      ...filters,
      timestamp: Date.now().toString()
    });
  };

  return (
    <div>
      {/* Search form */}
    </div>
  );
}
```

## Browser vs Server Usage

The library works seamlessly in both environments:

### Browser Environment

```typescript
import { addSearchParams } from '@cjkihl/url';

// Works with window.location.origin
const url = addSearchParams('/api/data', { page: '1' });
console.log(url); // "/api/data?page=1"
```

### Server Environment

```typescript
import { addSearchParams } from '@cjkihl/url';

// Works with absolute URLs
const url = addSearchParams('https://api.example.com/data', { page: '1' });
console.log(url); // "https://api.example.com/data?page=1"
```

## Error Handling

The library handles edge cases gracefully:

```typescript
import { sanitizeSiteUrl } from '@cjkihl/url';

// Invalid URLs are handled gracefully
const invalidUrl = sanitizeSiteUrl('not-a-valid-url', 'https://example.com');
console.log(invalidUrl.toString()); // "https://example.com/not-a-valid-url"

// Empty strings are handled
const emptyUrl = sanitizeSiteUrl('', 'https://example.com');
console.log(emptyUrl.toString()); // "https://example.com/"
```

## Testing

Run the test suite:

```bash
bun test
```

## Requirements

- Node.js >= 18.0.0 or Bun
- TypeScript >= 5.0.0 (for type definitions)

## License

MIT
