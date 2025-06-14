# @cjkihl/create-exports

A tool to automatically generate exports and binary entries in your package.json based on your TypeScript files.

## Features

- Automatically finds and generates exports for public files (`.pub.ts`, `.pub.tsx`)
- Automatically finds and generates binary entries for CLI files (`.bin.ts`, `.bin.tsx`)
- Supports custom package.json and tsconfig.json paths
- Dry run mode to preview changes
- Sorts exports and binary entries alphabetically
- Handles index files and nested directories correctly

## Installation

```bash
# Using npm
npm install @cjkihl/create-exports

# Using yarn
yarn add @cjkihl/create-exports

# Using pnpm
pnpm add @cjkihl/create-exports

# Using bun
bun add @cjkihl/create-exports
```

## Usage

### Command Line

```bash
# Show help
create-exports --help

# Run with default settings
create-exports

# Dry run to see what would change
create-exports --dry-run

# Use custom package.json and tsconfig.json
create-exports --package-json ./custom/package.json --tsconfig ./custom/tsconfig.json
```

### Options

- `-p, --package-json <path>`: Path to package.json file
- `-t, --tsconfig <path>`: Path to tsconfig.json file
- `-d, --dry-run`: Show what would be changed without writing
- `-h, --help`: Show help message

### Programmatic Usage

```typescript
import { createExports } from "@cjkihl/create-exports";

// With default options
await createExports();

// With custom options
await createExports({
  packageJsonPath: "./custom/package.json",
  tsconfigPath: "./custom/tsconfig.json",
  dryRun: true
});
```

## File Naming Conventions

### Public Exports

Files that should be exported must end with `.pub.ts` or `.pub.tsx`. For example:

- `index.pub.ts` → exported as root
- `src/utils.pub.ts` → exported as `./src/utils`
- `src/components/index.pub.tsx` → exported as `./src/components`

### Binary Files

Files that should be available as CLI commands must end with `.bin.ts` or `.bin.tsx`. For example:

- `cli.bin.ts` → available as `cli` command
- `tools/helper.bin.ts` → available as `helper` command

## Output

The tool will update your package.json with:

1. `exports` field containing all public exports with their TypeScript types
2. `bin` field containing all binary entries

Example output:

```json
{
  "exports": {
    ".": {
      "types": "types/index.pub.d.ts",
      "default": "dist/index.pub.js"
    },
    "./src/utils": {
      "types": "types/src/utils.pub.d.ts",
      "default": "dist/src/utils.pub.js"
    }
  },
  "bin": {
    "cli": "dist/cli.bin.js",
    "helper": "dist/tools/helper.bin.js"
  }
}
```

## Requirements

- Node.js >= 18.0.0
- TypeScript project with tsconfig.json
- package.json

## License

MIT
