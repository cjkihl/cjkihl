# @cjkihl/with-env

A utility for loading environment variables in monorepos and executing commands with the loaded environment.

## Features

- 🔧 **Monorepo Support**: Automatically finds and loads environment files from the monorepo root
- 📁 **Multiple Env Files**: Supports loading from `.env.default` and `.env.local` files (configurable)
- 🚀 **Command Execution**: Executes commands with the loaded environment variables
- 🛡️ **Production Safety**: Optionally skips loading env files in production environments
- 📦 **CLI Tool**: Includes a command-line interface for easy integration
- 🔌 **Programmatic API**: Can be used as a library in your Node.js applications

## Installation

```bash
npm install @cjkihl/with-env
```

## Usage

### Command Line Interface

The package provides a CLI tool that loads environment variables and executes commands:

```bash
# Basic usage - loads .env.default and .env.local (with .env.local overriding .env.default) and runs a command
npx with-env npm run dev

# With custom environment file
npx with-env --env-file=.env.development npm run dev

# Disable production skip
npx with-env --skip-production=false npm run build

# Disable stdio inheritance (useful for capturing output)
npx with-env --inherit-stdio=false npm run test
```

### Programmatic Usage

```typescript
import { loadEnv } from '@cjkihl/with-env';

// Basic usage
await loadEnv({
  command: 'npm',
  args: ['run', 'dev']
});

// With custom configuration
await loadEnv({
  envFile: ['.env.development', '.env'],
  skipInProduction: false,
  inheritStdio: true,
  command: 'node',
  args: ['server.js']
});
```

## Configuration

### WithEnvConfig Interface

```typescript
interface WithEnvConfig {
  envFile?: string[];           // Array of env file names to load in order (default: ['.env.default', '.env.local'])
  skipInProduction?: boolean;   // Skip loading env files in production (default: true)
  inheritStdio?: boolean;       // Inherit stdio from parent process (default: true)
  command?: string;             // Command to execute
  args?: string[];              // Arguments for the command
}
```

### CLI Options

- `--env-file=<file>`: Specify environment file(s) to load
- `--skip-production=<boolean>`: Control whether to skip loading in production (default: true)
- `--inherit-stdio=<boolean>`: Control stdio inheritance (default: true)

## How It Works

1. **Monorepo Detection**: Uses `@manypkg/get-packages` to find the monorepo root directory
2. **Environment Loading**: Searches for environment files in the root directory in order of preference
3. **Variable Injection**: Loads and parses the environment file using `dotenv`
4. **Process Execution**: Spawns a child process with the loaded environment variables
5. **Error Handling**: Provides detailed error messages and proper exit codes

## Environment File Loading

The tool loads environment files in the specified order and merges them:

1. **Default behavior**: Loads `.env.default` first, then `.env.local` (with `.env.local` overriding variables from `.env.default`)
2. **Custom order**: Files are loaded in the order specified in the `envFile` array
3. **Merging**: Later files override variables from earlier files
4. **Missing files**: If a file doesn't exist, it's skipped without error

## Examples

### Development Workflow

```bash
# Load environment and start development server
npx with-env npm run dev

# Load specific environment file for testing
npx with-env --env-file=.env.test npm run test
```

### Production Deployment

```bash
# Load environment and build for production
npx with-env --skip-production=false npm run build

# Deploy with custom environment
npx with-env --env-file=.env.production npm run deploy
```

### Integration in Scripts

```json
{
  "scripts": {
    "dev": "with-env npm run dev:server",
    "test": "with-env --env-file=.env.test npm run test:runner",
    "build": "with-env --skip-production=false npm run build:app"
  }
}
```

## Error Handling

The tool provides comprehensive error handling:

- **File Not Found**: Gracefully handles missing environment files
- **Parse Errors**: Reports issues with malformed environment files
- **Command Failures**: Returns detailed error information for failed commands
- **Process Errors**: Handles spawn failures and provides context

## Requirements

- Node.js >= 18.0.0
- Works in monorepo environments (uses `@manypkg/get-packages`)

## License

MIT