# @cjkihl/cookies

A minimal, type-safe cookies library for Bun/Node.js with Standard Schema validation support.

## Features

- 🔒 **Type-safe**: Full TypeScript support with generics
- 🎯 **Standard Schema compatible**: Works with any Standard Schema library (Zod, Valibot, ArkType, etc.)
- 🌐 **Universal**: Works in both browser and server environments
- ⚡ **Minimal**: Lightweight with minimal dependencies
- 🔧 **Flexible**: Support for all cookie attributes and options

## Installation

```bash
bun add @cjkihl/cookies
```

The library uses the official `@standard-schema/spec` package for Standard Schema types, which is included as a dependency.

## Quick Start

### Root Import (All Functions)

You can import all functions from the root package:

```typescript
import { 
  // Client functions
  getClientCookies, setClientCookie, getClientCookie, deleteClientCookie,
  // Server functions  
  getServerCookies, setServerCookie, getServerCookie, deleteServerCookie,
  // Types and utilities
  type Cookie, type CookieOptions
} from "@cjkihl/cookies";
```

### Client-side (Browser)

```typescript
import { getCookies, setCookie, getCookie, deleteCookie } from "@cjkihl/cookies/client";

// Get all cookies
const cookies = getCookies();

// Get a specific cookie
const userCookie = getCookie("user");

// Set a simple cookie
setCookie("theme", { value: "dark" });

// Set a cookie with options
setCookie("session", {
  value: "abc123",
  expires: new Date("2024-12-31"),
  path: "/",
  secure: true,
  httpOnly: false,
  sameSite: "Strict"
});

// Delete a cookie
deleteCookie("old-cookie");
```

### Server-side

```typescript
import { getCookies, setCookie, getCookie, deleteCookie } from "@cjkihl/cookies/server";

// Get cookies from request
const cookies = getCookies(request);

// Get a specific cookie
const userCookie = getCookie(request, "user");

// Set cookie on response
setCookie(response, "session", {
  value: "abc123",
  expires: new Date("2024-12-31"),
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "Strict"
});

// Delete a cookie
deleteCookie(response, "old-cookie");
```

## Standard Schema Validation

The library supports validation using any Standard Schema compatible library.

### With Zod

```typescript
import { z } from "zod";
import { getCookies, setCookie } from "@cjkihl/cookies/client";

// Create a schema
const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email()
});

// Get cookies with validation
const cookies = getCookies(userSchema);
// cookies.user.value will be typed as { id: number; name: string; email: string }

// Set cookie with validation
setCookie("user", {
  value: { id: 1, name: "John", email: "john@example.com" },
  schema: userSchema
});
```

### With Valibot

```typescript
import { object, number, string, email } from "valibot";
import { getCookies, setCookie } from "@cjkihl/cookies/client";

// Create a schema
const userSchema = object({
  id: number(),
  name: string(),
  email: string([email()])
});

// Get cookies with validation
const cookies = getCookies(userSchema);

// Set cookie with validation
setCookie("user", {
  value: { id: 1, name: "John", email: "john@example.com" },
  schema: userSchema
});
```

### With ArkType

```typescript
import { type } from "arktype";
import { getCookies, setCookie } from "@cjkihl/cookies/client";

// Create a schema
const userSchema = type({
  id: "number",
  name: "string",
  email: "string"
});

// Get cookies with validation
const cookies = getCookies(userSchema);

// Set cookie with validation
setCookie("user", {
  value: { id: 1, name: "John", email: "john@example.com" },
  schema: userSchema
});
```

## API Reference

### Client Functions

#### `getCookies<T = string>(schema?: StandardSchemaV1<T>): CookieRecord<T>`

Get all cookies from `document.cookie`.

#### `getCookie<T = string>(key: string, schema?: StandardSchemaV1<T>): Cookie<T> | undefined`

Get a specific cookie by key.

#### `setCookie<T = string>(key: string, options: CookieOptions<T>): void`

Set a cookie with full options.

#### `setCookieSimple<T = string>(key: string, value: T, options?: Omit<CookieOptions<T>, "value">): void`

Set a cookie with a simple value and optional options.

#### `deleteCookie(key: string, options?: { path?: string; domain?: string }): void`

Delete a cookie by setting an expired date.

### Server Functions

#### `getCookies<T = string>(req: Request | Headers, schema?: StandardSchemaV1<T>): CookieRecord<T>`

Get all cookies from request headers.

#### `getCookie<T = string>(req: Request | Headers, key: string, schema?: StandardSchemaV1<T>): Cookie<T> | undefined`

Get a specific cookie from request headers.

#### `setCookie<T = string>(res: Response | Headers, key: string, options: CookieOptions<T>): void`

Set a cookie on response headers.

#### `setCookieSimple<T = string>(res: Response | Headers, key: string, value: T, options?: Omit<CookieOptions<T>, "value">): void`

Set a cookie with a simple value on response headers.

#### `deleteCookie(res: Response | Headers, key: string, options?: { path?: string; domain?: string }): void`

Delete a cookie on response headers.

### Types

#### `Cookie<T = string>`

```typescript
interface Cookie<T = string> {
  value: T;
  expires?: Date;
  maxAge?: number;
  domain?: string;
  path?: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}
```

#### `CookieOptions<T = string>`

```typescript
interface CookieOptions<T = string> {
  value: T;
  expires?: Date;
  maxAge?: number;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
  schema?: StandardSchemaV1<T>;
}
```

## Examples

### Basic Cookie Management

```typescript
import { getCookies, setCookie, deleteCookie } from "@cjkihl/cookies/client";

// Set a simple cookie
setCookie("theme", { value: "dark" });

// Set a cookie with expiration
setCookie("session", {
  value: "abc123",
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  path: "/",
  secure: true
});

// Get all cookies
const cookies = getCookies();
console.log(cookies.theme?.value); // "dark"

// Delete a cookie
deleteCookie("old-session", { path: "/" });
```

### Validation with Zod

```typescript
import { z } from "zod";
import { getCookie, setCookie } from "@cjkihl/cookies/client";

// Define schemas
const themeSchema = z.enum(["light", "dark"]);
const userSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  preferences: z.object({
    theme: themeSchema,
    notifications: z.boolean()
  })
});

// Set validated cookies
setCookie("theme", { value: "dark", schema: themeSchema });
setCookie("user", {
  value: {
    id: 1,
    name: "John Doe",
    preferences: { theme: "dark", notifications: true }
  },
  schema: userSchema
});

// Get validated cookies
const theme = getCookie("theme", themeSchema);
const user = getCookie("user", userSchema);

// TypeScript knows the exact types
console.log(theme?.value); // "light" | "dark"
console.log(user?.value.preferences.theme); // "light" | "dark"
```

### Server-side Usage

```typescript
import { getCookies, setCookie } from "@cjkihl/cookies/server";

// Handle incoming request
async function handleRequest(request: Request) {
  // Get cookies from request
  const cookies = getCookies(request);
  
  // Process request...
  const response = new Response("Hello World");
  
  // Set cookies on response
  setCookie(response, "session", {
    value: "new-session-id",
    httpOnly: true,
    secure: true,
    sameSite: "Strict"
  });
  
  return response;
}
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