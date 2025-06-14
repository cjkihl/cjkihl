# @cjkihl/create-exports

A tool to generate package exports configuration for TypeScript packages. This utility helps set up proper exports configuration in your package.json for both ESM and CommonJS modules.

## Installation

```bash
bun add @cjkihl/create-exports
```

## Usage

```typescript
import { createExports } from '@cjkihl/create-exports';

// Generate exports configuration for your package
const exports = await createExports({
  entry: './src/index.ts',
  outDir: './dist'
});

// The exports object can be directly used in package.json
console.log(exports);
```

## API

### `createExports(options: CreateExportsOptions)`

Returns a Promise that resolves to an exports configuration object.

#### Options

- `entry`: The entry point file path (relative to package root)
- `outDir`: The output directory for built files
- `types`: Optional path to types file (defaults to entry path with .d.ts extension)

### Example Output

```json
{
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js",
    "require": "./dist/index.cjs"
  }
}
```

## Integration with Build Tools

This package works well with build tools like Bun, esbuild, or tsc. It's designed to be used in your build process to automatically generate the correct exports configuration.

## License

MIT
