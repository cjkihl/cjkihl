# @cjkihl/with-coolify-env

A robust Node.js utility for loading environment variables from [Coolify](https://coolify.io/) and executing commands with those variables loaded. Perfect for CI/CD pipelines, development workflows, and production deployments.

## Features

- 🔐 **Secure**: Loads environment variables from Coolify's secure API
- 🚀 **Flexible**: Works as both a library and CLI tool
- 🔄 **Fallback Support**: Uses environment variables as configuration fallbacks
- 🛡️ **Production Safe**: Configurable to skip loading in production environments
- ⚡ **Fast**: Efficient API calls with timeout protection
- 📝 **Well Documented**: Comprehensive TypeScript types and JSDoc comments

## Installation

```bash
npm install @cjkihl/with-coolify-env
```

Or with yarn:

```bash
yarn add @cjkihl/with-coolify-env
```

Or with bun:

```bash
bun add @cjkihl/with-coolify-env
```

## Quick Start

### As a Library

```typescript
import { loadEnv } from '@cjkihl/with-coolify-env';

// Basic usage with environment variables
await loadEnv({
  command: 'npm',
  args: ['start']
});

// Explicit configuration
await loadEnv({
  endpoint: 'https://coolify.example.com',
  appId: 'my-app-id',
  token: 'my-api-token',
  command: 'node',
  args: ['server.js']
});
```

### As a CLI Tool

```bash
# Basic usage
with-coolify-env npm start

# With explicit configuration
with-coolify-env --endpoint=https://coolify.example.com --app-id=my-app node server.js
```

## Configuration

### Environment Variables

You can configure the tool using environment variables:

```bash
export COOLIFY_ENDPOINT="https://coolify.example.com"
export COOLIFY_APP_ID="my-app-id"
export COOLIFY_TOKEN="my-api-token"
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `endpoint` | `string` | `process.env.COOLIFY_ENDPOINT` | Coolify API endpoint URL |
| `appId` | `string` | `process.env.COOLIFY_APP_ID` | Coolify application ID |
| `token` | `string` | `process.env.COOLIFY_TOKEN` | Coolify API token |
| `command` | `string` | - | Command to execute (required) |
| `args` | `string[]` | `[]` | Arguments for the command |

> **Note:** The child process always inherits stdio from the parent process.

## API Reference

### `loadEnv(config?: WithCoolifyEnvConfig): Promise<void>`

Loads environment variables from Coolify and executes a command with those variables.

#### Parameters

- `config` (optional): Configuration object

#### Returns

A promise that resolves when the child process exits successfully, or rejects with an error.

#### Throws

- `Error`: When no command is provided
- `Error`: When the child process fails to execute or exits with a non-zero code
- `Error`: When Coolify API requests fail

### `WithCoolifyEnvConfig` Interface

```typescript
interface WithCoolifyEnvConfig {
  endpoint?: string;
  appId?: string;
  token?: string;
  command?: string;
  args?: string[];
}
```

## CLI Usage

### Command Line Options

```bash
with-coolify-env [options] <command> [args...]
```

#### Options

- `--endpoint=<url>`: Coolify API endpoint URL
- `--app-id=<id>`: Coolify application ID
- `--token=<token>`: Coolify API token
- `--help`: Show help message

### Examples

```bash
# Start a Node.js application
with-coolify-env npm start

# Run a build with explicit configuration
with-coolify-env \
  --endpoint=https://coolify.example.com \
  --app-id=my-app \
  --token=my-token \
  npm run build

# Execute a custom script
with-coolify-env node scripts/deploy.js
```

## Use Cases

### Development Workflow

```bash
# Load environment variables and start development server
with-coolify-env npm run dev
```

### CI/CD Pipeline

```bash
# In your CI script
with-coolify-env \
  --endpoint=$COOLIFY_ENDPOINT \
  --app-id=$COOLIFY_APP_ID \
  --token=$COOLIFY_TOKEN \
  npm run build
```

### Docker Containers

```dockerfile
# In your Dockerfile
RUN npm install -g @cjkihl/with-coolify-env

# In your entrypoint script
with-coolify-env node server.js
```

## Error Handling

The library provides detailed error messages for common issues:

### Missing Configuration

```bash
Error: Missing required Coolify configuration: endpoint, appId, token. 
Please provide these values either in the config or as environment variables 
(COOLIFY_ENDPOINT, COOLIFY_APP_ID, COOLIFY_TOKEN).
```

### API Errors

```bash
Error: Failed to fetch environment variables from Coolify: HTTP 401 Unauthorized
Response: {"error": "Invalid token"}
```

### Command Execution Errors

```bash
Error: Command failed with exit code 1
Command: npm start
Error output:
npm ERR! missing script: start
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Ensure your Coolify token is valid and has the necessary permissions
2. **Network Timeouts**: The API request has a 30-second timeout. Check your network connection
3. **Invalid App ID**: Verify that the application ID exists in your Coolify instance

### Debug Mode

Enable debug logging by setting the `DEBUG` environment variable:

```bash
DEBUG=* with-coolify-env npm start
```

## Security Considerations

- **Token Security**: Never commit API tokens to version control
- **Environment Variables**: Use environment variables for sensitive configuration
- **Network Security**: Ensure HTTPS is used for Coolify endpoints in production
- **Token Permissions**: Use tokens with minimal required permissions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/cjkihl/cjkihl/issues) on GitHub.
