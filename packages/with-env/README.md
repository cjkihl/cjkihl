# @cjkihl/find-root

A utility to find the root directory of a monorepo by detecting lockfiles. Supports multiple package managers including npm, yarn, pnpm, and Bun.

## Installation

```bash
bun add @cjkihl/find-root
```

## Usage

```typescript
import { findRoot } from '@cjkihl/find-root';

// Find the root directory of your monorepo
const { root, lockfile, packageManager } = await findRoot();
console.log(`Root directory: ${root}`);
console.log(`Lockfile: ${lockfile}`);
console.log(`Package manager: ${packageManager}`);
```

## API

### `findRoot()`

Returns a Promise that resolves to an object containing:
- `root`: The absolute path to the monorepo root directory
- `lockfile`: The absolute path to the detected lockfile
- `packageManager`: The detected package manager ('npm', 'yarn', 'pnpm', or 'bun')

### Supported Lockfiles

- `package-lock.json` (npm)
- `yarn.lock` (yarn)
- `pnpm-lock.yaml` (pnpm)
- `bun.lock` (Bun)
- `bun.lockb` (Bun)

## Error Handling

The function will throw an error if:
- No lockfile is found in the current directory or any parent directory
- The detected lockfile is not recognized

## License

MIT 