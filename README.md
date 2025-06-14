# @cjkihl/monorepo

A collection of TypeScript utilities and configurations for modern Node.js development.

## Packages

- [@cjkihl/find-root](./packages/find-root) - Utility to find monorepo root directory by detecting lockfiles
- [@cjkihl/create-exports](./packages/create-exports) - Tool to generate package exports configuration
- [@cjkihl/tsconfig](./packages/tsconfig) - Shared TypeScript configurations for Node.js projects

## Getting Started

This monorepo uses [Bun](https://bun.sh) as the package manager and build tool.

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Run tests
bun test
```

## Development

Each package in the `packages/` directory is independently versioned and can be published to npm. The packages are configured to work together but can also be used standalone.

### Adding a New Package

1. Create a new directory in `packages/`
2. Initialize with `bun init`
3. Add necessary dependencies
4. Update the root `package.json` build script if needed

### Publishing

To publish a package:

1. Update the version in the package's `package.json`
2. Run `bun run build` to ensure everything is built
3. Navigate to the package directory and run `bun publish`

## License

MIT