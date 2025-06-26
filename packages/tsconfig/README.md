# @cjkihl/tsconfig

Shared TypeScript configurations for Node.js and browser projects. This package provides base, library, and browser configurations that can be extended in your projects.

## Installation

```bash
bun add -D @cjkihl/tsconfig
```

## Usage

### Base Configuration

For basic Node.js projects, extend the base configuration:

```json
{
  "extends": "@cjkihl/tsconfig/tsconfig.base"
}
```

### Library Configuration

For TypeScript libraries that need to generate declaration files:

```json
{
  "extends": "@cjkihl/tsconfig/tsconfig.lib"
}
```

### Browser Configuration

For browser-based projects (React, Vue, etc.):

```json
{
  "extends": "@cjkihl/tsconfig/tsconfig.browser"
}
```

## Features

### Base Configuration (`tsconfig.base.json`)

- Modern JavaScript features (ES2022)
- Strict type checking
- Module bundler support
- Node.js types
- Source maps
- Path aliases support

### Library Configuration (`tsconfig.lib.json`)

Extends the base configuration with:
- Declaration file generation
- Composite project support
- Declaration source maps
- Optimized for library publishing

### Browser Configuration (`tsconfig.browser.json`)

Extends the base configuration with:
- DOM types and APIs
- Browser-specific libraries
- DOM iteration support
- Optimized for frontend development

## Configuration Details

### Base Configuration

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "Preserve",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "lib": ["es2022"]
  }
}
```

### Library Configuration

```json
{
  "compilerOptions": {
    "declaration": true,
    "composite": true,
    "sourceMap": true,
    "declarationMap": true
  }
}
```

### Browser Configuration

```json
{
  "compilerOptions": {
    "lib": ["es2022", "dom", "dom.iterable"]
  }
}
```

## License

MIT
