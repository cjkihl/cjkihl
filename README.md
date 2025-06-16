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

### Versioning and Publishing

This monorepo uses [Changesets](https://github.com/changesets/changesets) for versioning and publishing. Changesets automatically handles workspace dependencies and generates changelogs.

#### Making Changes

When you make changes that require a version bump:

1. Create a changeset:
   ```bash
   bun changeset
   ```
   This will prompt you to:
   - Select which packages have changed
   - Choose the type of version bump (major, minor, patch)
   - Write a description of the changes

2. Commit and push the changeset file in `.changesets/` to main
3. The GitHub Action will automatically:
   - Version the packages
   - Build the packages
   - Publish to npm

If you need to manually publish (not recommended):
```bash
bun run release
```

## License

MIT