# turbo-env

A CLI tool and library for automatically syncing environment variables from `.env` files to your Turborepo configuration.

## Features

- 🔄 Automatically syncs environment variables from `.env` files to `turbo.json`
- 📝 Supports multiple environment files with priority order
- 🛠️ Available as both a CLI tool and a library
- 🔍 Intelligently finds your project root
- ✨ Zero configuration needed for basic usage

## Installation

```bash
# Using npm
npm install @cjkihl/turbo-env

# Using yarn
yarn add @cjkihl/turbo-env

# Using pnpm
pnpm add @cjkihl/turbo-env
```

## Usage

### CLI

The CLI tool can be used to quickly sync your environment variables:

```bash
# Use default env files (.env.local, .env)
turbo-env

# Specify custom env files
turbo-env -e .env.production .env.staging .env
```

### Programmatic Usage

You can also use the package programmatically in your Node.js code:

```typescript
import setTurboEnv from '@cjkihl/turbo-env';

// Use default env files (.env.local, .env)
await setTurboEnv({});

// Specify custom env files
await setTurboEnv({
  envFile: ['.env.production', '.env.staging', '.env']
});
```

## API Reference

### `setTurboEnv(config: WithEnvConfig)`

Synchronizes environment variables from `.env` files to your Turborepo configuration.

#### Parameters

- `config` (optional): Configuration object
  - `envFile` (optional): Array of environment file paths to check in order of priority
    - Default: `['.env.local', '.env']`

#### Returns

- `Promise<void>`

#### Throws

- `Error` if no environment variables are found in any of the specified env files
- `Error` if `turbo.json` file doesn't exist

## How It Works

1. The tool searches for environment files in your project root
2. It reads the first existing environment file from the provided list
3. Extracts all environment variable keys
4. Updates the `globalEnv` array in your `turbo.json` configuration
5. Saves the updated configuration back to `turbo.json`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
