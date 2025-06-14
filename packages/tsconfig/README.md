# @cjkihl/tsconfig

Shared TypeScript configurations for Node.js projects. This package provides base and library configurations that can be extended in your projects.

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

## License

MIT
