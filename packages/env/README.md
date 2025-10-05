# @cjkihl/env

Type-safe environment variable validation and management with Zod schemas. Create validated, type-safe environment configurations for both browser and server environments.

## Features

- 🔒 **Type-safe**: Full TypeScript support with automatic type inference
- 🎯 **Zod validation**: Built-in support for Zod schemas with comprehensive validation
- 🌐 **Universal**: Works in both browser and server environments
- 📝 **Auto-generated env files**: Generate `.env` files with documentation and defaults
- 🔧 **Flexible**: Support for optional variables, defaults, and custom validation
- 📦 **Lightweight**: Minimal dependencies with zero runtime overhead

## Installation

```bash
bun add @cjkihl/env
```

## Quick Start

### Basic Usage

```typescript
import { createEnv } from '@cjkihl/env';
import { z } from 'zod';

const env = createEnv({
  name: 'app',
  description: 'Application environment variables',
  env: {
    API_KEY: [z.string().min(1), process.env.API_KEY],
    PORT: [z.string().regex(/^\d+$/).transform(Number), process.env.PORT],
    DEBUG: [z.string().optional(), process.env.DEBUG],
    DATABASE_URL: [z.string().url(), process.env.DATABASE_URL],
  },
});

// TypeScript knows the exact types
console.log(env.API_KEY); // string
console.log(env.PORT); // number
console.log(env.DEBUG); // string | undefined
console.log(env.DATABASE_URL); // string
```

### Browser Environment Support

The library automatically handles browser vs server environments:

```typescript
import { createEnv } from '@cjkihl/env';
import { z } from 'zod';

const env = createEnv({
  name: 'client',
  description: 'Client-side environment variables',
  env: {
    // These will be available in browser
    VITE_API_URL: [z.string().url(), process.env.VITE_API_URL],
    NEXT_PUBLIC_APP_NAME: [z.string(), process.env.NEXT_PUBLIC_APP_NAME],
    
    // These will be skipped in browser (server-only)
    DATABASE_URL: [z.string().url(), process.env.DATABASE_URL],
    SECRET_KEY: [z.string().min(32), process.env.SECRET_KEY],
  },
});
```

## Advanced Usage

### Multiple Environment Groups

```typescript
import { createEnv, mergeEnvs } from '@cjkihl/env';
import { z } from 'zod';

// Server environment
const serverEnv = createEnv({
  name: 'server',
  description: 'Server-side environment variables',
  env: {
    DATABASE_URL: [z.string().url(), process.env.DATABASE_URL],
    JWT_SECRET: [z.string().min(32), process.env.JWT_SECRET],
    PORT: [z.string().regex(/^\d+$/).transform(Number), process.env.PORT],
  },
});

// Client environment
const clientEnv = createEnv({
  name: 'client',
  description: 'Client-side environment variables',
  env: {
    VITE_API_URL: [z.string().url(), process.env.VITE_API_URL],
    VITE_APP_NAME: [z.string(), process.env.VITE_APP_NAME],
  },
});

// Merge environments
const env = mergeEnvs(serverEnv, clientEnv);
```

### Optional Variables and Defaults

```typescript
import { createEnv } from '@cjkihl/env';
import { z } from 'zod';

const env = createEnv({
  name: 'app',
  description: 'Application configuration',
  env: {
    // Required variable
    API_KEY: [z.string().min(1), process.env.API_KEY],
    
    // Optional variable
    DEBUG: [z.string().optional(), process.env.DEBUG],
    
    // Variable with default value
    PORT: [z.string().regex(/^\d+$/).transform(Number).default('3000'), process.env.PORT],
    
    // Variable with description
    DATABASE_URL: [
      z.string()
        .url()
        .describe('PostgreSQL database connection string'),
      process.env.DATABASE_URL
    ],
  },
});
```

### Skip Validation

```typescript
import { createEnv } from '@cjkihl/env';
import { z } from 'zod';

// Skip validation entirely (useful for development)
const env = createEnv({
  name: 'app',
  description: 'Development environment',
  skipValidation: true,
  env: {
    API_KEY: [z.string(), process.env.API_KEY],
    PORT: [z.string(), process.env.PORT],
  },
});

// Or use environment variable
// SKIP_ENV_VALIDATION=true bun run dev
```

## Environment File Generation

Generate `.env` files with documentation and proper formatting:

```typescript
import { createEnv, mergeEnvs } from '@cjkihl/env';
import createEnvFile from '@cjkihl/env/create-env-file';
import { z } from 'zod';

const serverEnv = createEnv({
  name: 'server',
  description: 'Server environment variables',
  env: {
    DATABASE_URL: [
      z.string().url().describe('PostgreSQL connection string'),
      process.env.DATABASE_URL
    ],
    JWT_SECRET: [
      z.string().min(32).describe('JWT signing secret'),
      process.env.JWT_SECRET
    ],
    PORT: [
      z.string().regex(/^\d+$/).transform(Number).default('3000'),
      process.env.PORT
    ],
  },
});

const clientEnv = createEnv({
  name: 'client',
  description: 'Client environment variables',
  env: {
    VITE_API_URL: [
      z.string().url().describe('API base URL'),
      process.env.VITE_API_URL
    ],
    VITE_APP_NAME: [
      z.string().describe('Application name'),
      process.env.VITE_APP_NAME
    ],
  },
});

const mergedEnv = mergeEnvs(serverEnv, clientEnv);

// Generate .env file
const envFileContent = createEnvFile('my-app', mergedEnv);
console.log(envFileContent);
```

This generates a well-formatted `.env` file:

```env
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# Env file for my-app
#                                                                                               
# Don't forget to add to .gitignore.    
#                                                            
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                                    client                                    ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
# API base URL
VITE_API_URL=""

# Application name
VITE_APP_NAME=""

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                                    server                                    ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
# PostgreSQL connection string
DATABASE_URL=""

# JWT signing secret
JWT_SECRET=""

# (Default: 3000)
PORT="3000"
```

### With Existing Values

```typescript
// Preserve existing values when generating .env file
const existingValues = {
  DATABASE_URL: 'postgresql://localhost:5432/mydb',
  VITE_APP_NAME: 'My Awesome App',
};

const envFileContent = createEnvFile('my-app', mergedEnv, existingValues);
```

## API Reference

### `createEnv<T>(config: EnvConfig): Environment<T>`

Creates a type-safe environment configuration object.

#### Parameters

- `config.name`: String identifier for the environment group
- `config.description`: Optional description for the environment group
- `config.env`: Object mapping environment variable names to `[schema, value]` tuples
- `config.skipValidation`: Optional boolean to skip validation

#### Returns

A validated environment object with metadata and type-safe access to variables.

### `mergeEnvs<TArr>(...objects: TArr): MergeArrayOfObjects<TArr>`

Merges multiple environment objects into a single object.

#### Parameters

- `objects`: Environment objects to merge

#### Returns

A single merged environment object with combined metadata.

### `createEnvFile(projectName: string, env: Environment, existingValues?: Record<string, string>): string`

Generates a formatted `.env` file from an environment object.

#### Parameters

- `projectName`: Name of the project (used in file header)
- `env`: Environment object with metadata
- `existingValues`: Optional existing values to preserve

#### Returns

Formatted `.env` file content as a string.

## Types

### `EnvConfig`

```typescript
type EnvConfig = {
  name: string;
  description?: string;
  env: {
    [key: string]: [validator: z.ZodType<unknown, unknown>, value?: string];
  };
  skipValidation?: boolean;
};
```

### `Environment<T>`

```typescript
type Environment<T extends EnvConfig> = {
  [K in ExtractEnvKeys<T>]: ExtractEnvValue<T, K>;
} & {
  _meta?: MetaData;
};
```

### `MetaData`

```typescript
type MetaData = {
  [group: string]: {
    d?: string; // Description
    v: {
      [key: string]: {
        c?: string; // Comment/description
        def?: string; // Default value
        o?: boolean; // Optional
      };
    };
  };
};
```

## Examples

### Next.js Application

```typescript
// lib/env.ts
import { createEnv } from '@cjkihl/env';
import { z } from 'zod';

export const env = createEnv({
  name: 'app',
  description: 'Next.js application environment',
  env: {
    // Server-only variables
    DATABASE_URL: [z.string().url(), process.env.DATABASE_URL],
    JWT_SECRET: [z.string().min(32), process.env.JWT_SECRET],
    
    // Client variables (prefixed with NEXT_PUBLIC_)
    NEXT_PUBLIC_API_URL: [z.string().url(), process.env.NEXT_PUBLIC_API_URL],
    NEXT_PUBLIC_APP_NAME: [z.string(), process.env.NEXT_PUBLIC_APP_NAME],
    
    // Optional variables
    DEBUG: [z.string().optional(), process.env.DEBUG],
    PORT: [z.string().regex(/^\d+$/).transform(Number).default('3000'), process.env.PORT],
  },
});
```

### Vite Application

```typescript
// src/env.ts
import { createEnv } from '@cjkihl/env';
import { z } from 'zod';

export const env = createEnv({
  name: 'vite-app',
  description: 'Vite application environment',
  env: {
    // Vite variables (prefixed with VITE_)
    VITE_API_URL: [z.string().url(), process.env.VITE_API_URL],
    VITE_APP_NAME: [z.string(), process.env.VITE_APP_NAME],
    VITE_DEBUG: [z.string().optional(), process.env.VITE_DEBUG],
  },
});
```

### Express.js Server

```typescript
// src/config/env.ts
import { createEnv } from '@cjkihl/env';
import { z } from 'zod';

export const env = createEnv({
  name: 'server',
  description: 'Express server environment',
  env: {
    NODE_ENV: [z.enum(['development', 'production', 'test']), process.env.NODE_ENV],
    PORT: [z.string().regex(/^\d+$/).transform(Number).default('3000'), process.env.PORT],
    DATABASE_URL: [z.string().url(), process.env.DATABASE_URL],
    JWT_SECRET: [z.string().min(32), process.env.JWT_SECRET],
    CORS_ORIGIN: [z.string().url().optional(), process.env.CORS_ORIGIN],
  },
});
```

## Error Handling

The library provides detailed error messages for validation failures:

```typescript
try {
  const env = createEnv({
    name: 'app',
    env: {
      API_KEY: [z.string().min(1), process.env.API_KEY],
    },
  });
} catch (error) {
  console.error(error.message);
  // "Invalid value for environment variable API_KEY: undefined String must contain at least 1 character(s)"
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
- Zod >= 4.0.0

## License

MIT
