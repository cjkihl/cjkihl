# @cjkihl/publish

A smart package publishing tool that helps you manage and publish npm packages with ease. This tool provides intelligent version checking, retry mechanisms, and support for multiple package managers.

## Features

- 🔍 Smart version checking before publishing
- 🔄 Automatic retry with exponential backoff
- 🎯 Support for multiple package managers (npm, yarn, pnpm, bun)
- 🛡️ Dry run mode for safe testing
- 🏷️ Custom tag support
- 🔒 Access control (public/restricted)
- ⏭️ Skip private packages automatically

## Installation

```bash
npm install @cjkihl/publish
```

## Usage

### As a Module

```typescript
import { publish } from '@cjkihl/publish';

// Basic usage
await publish('./path/to/package');

// With options
await publish('./path/to/package', {
  retries: 5,
  retryDelay: 2000,
  dryRun: true,
  access: 'public',
  tag: 'beta'
});
```

### As a CLI

```bash
# Basic usage
publish ./path/to/package

# With options
publish ./path/to/package --dry-run --tag beta
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `retries` | number | 3 | Number of retry attempts if publish fails |
| `retryDelay` | number | 1000 | Initial delay between retries in milliseconds |
| `dryRun` | boolean | false | Run in dry-run mode without actually publishing |
| `access` | 'public' \| 'restricted' | 'public' | Package access level |
| `tag` | string | 'latest' | Distribution tag to publish to |

## Requirements

- Node.js >= 18.0.0

## License

MIT © [@cjkihl](https://github.com/cjkihl)
