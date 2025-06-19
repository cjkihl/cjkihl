# @cjkihl/bun-cors

A lightweight CORS middleware for Bun server applications. This package provides a simple and efficient way to handle Cross-Origin Resource Sharing (CORS) in your Bun applications.

## Installation

```bash
bun add @cjkihl/bun-cors
```

## Quick Start

```typescript
import { cors } from "@cjkihl/bun-cors";

const PORT = process.env.PORT || 4000;

Bun.serve({
  fetch: cors(
    async (req) => {
      return new Response("Hello from Bun!", { status: 200 });
    },
    {
      origin: ["http://localhost:3000", "https://myapp.com"],
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    }
  ),
  port: PORT,
});
```

## API

### `cors(handler, options?)`

Creates a CORS-enabled request handler.

#### Parameters

- `handler` (Function): Your request handler function that takes a `Request` and returns a `Promise<Response>`
- `options` (CorsOptions, optional): CORS configuration options

#### Returns

A new request handler function that automatically handles CORS headers and preflight requests.

## Configuration Options

### `origin`

Specifies which origins are allowed to access the resource.

- **Type**: `string | (string | RegExp)[]`
- **Default**: `"*"` (allows all origins)

```typescript
// Allow specific origins
origin: ["http://localhost:3000", "https://myapp.com"]

// Allow all origins (default)
origin: "*"

// Use regex patterns
origin: [/^https:\/\/.*\.myapp\.com$/, "http://localhost:3000"]
```

### `methods`

Specifies which HTTP methods are allowed.

- **Type**: `string[]`
- **Default**: `["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]`

```typescript
methods: ["GET", "POST", "PUT", "DELETE"]
```

### `headers`

Specifies which headers can be used in the actual request.

- **Type**: `string[]`
- **Default**: `["Content-Type", "Authorization"]`

```typescript
headers: ["Content-Type", "Authorization", "X-Custom-Header"]
```

### `maxAge`

Specifies how long (in seconds) the results of a preflight request can be cached.

- **Type**: `number`
- **Default**: `3600` (1 hour)

```typescript
maxAge: 86400 // 24 hours
```

### `credentials`

Specifies whether the request can include user credentials like cookies, authorization headers, or TLS client certificates.

- **Type**: `boolean`
- **Default**: `false`

```typescript
credentials: true
```

**Note**: When `credentials` is `true`, the `origin` cannot be `"*"` and must be a specific origin or array of origins.

## Examples

### Basic Usage

```typescript
import { cors } from "@cjkihl/bun-cors";

Bun.serve({
  fetch: cors(async (req) => {
    return new Response("Hello World!", { status: 200 });
  }),
  port: 3000,
});
```

### Custom Configuration

```typescript
import { cors } from "@cjkihl/bun-cors";

Bun.serve({
  fetch: cors(
    async (req) => {
      const data = { message: "Hello from API!", timestamp: Date.now() };
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    },
    {
      origin: ["http://localhost:3000", "https://myapp.com"],
      methods: ["GET", "POST"],
      headers: ["Content-Type", "Authorization", "X-API-Key"],
      credentials: true,
      maxAge: 7200, // 2 hours
    }
  ),
  port: 4000,
});
```

### With Authentication

```typescript
import { cors } from "@cjkihl/bun-cors";

Bun.serve({
  fetch: cors(
    async (req) => {
      // Your authentication logic here
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response("Unauthorized", { status: 401 });
      }

      return new Response("Authenticated response", { status: 200 });
    },
    {
      origin: "https://myapp.com",
      credentials: true,
      headers: ["Content-Type", "Authorization"],
    }
  ),
  port: 5000,
});
```

### Development vs Production

```typescript
import { cors } from "@cjkihl/bun-cors";

const isDevelopment = process.env.NODE_ENV === "development";

Bun.serve({
  fetch: cors(
    async (req) => {
      return new Response("API Response", { status: 200 });
    },
    {
      origin: isDevelopment 
        ? ["http://localhost:3000", "http://localhost:3001"]
        : ["https://myapp.com", "https://admin.myapp.com"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
    }
  ),
  port: 4000,
});
```

## Features

- ✅ **Lightweight**: Minimal overhead and dependencies
- ✅ **TypeScript Support**: Full type definitions included
- ✅ **Flexible Origin Matching**: Support for exact strings and regex patterns
- ✅ **Automatic Preflight Handling**: Handles OPTIONS requests automatically
- ✅ **Credentials Support**: Full support for cookies and authentication headers
- ✅ **Configurable Headers**: Customizable allowed headers and methods
- ✅ **Caching Control**: Configurable preflight response caching

## License

MIT
