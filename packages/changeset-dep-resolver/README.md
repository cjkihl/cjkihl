# @cjkihl/changeset-dep-resolver

A CLI tool to resolve workspace dependencies before publishing packages in a monorepo. This tool automatically converts `workspace:` dependencies to specific versions for publishing.

## Features

- 🔄 **Automatic Resolution**: Converts `workspace:` dependencies to specific versions
- 📦 **Release Plan Aware**: Uses changesets release plan to determine new versions
- 🛡️ **Backup & Restore**: Creates backups and provides restore functionality
- 🔍 **NPM Integration**: Falls back to npm for external packages
- 🚀 **CLI Interface**: Easy-to-use command line interface
- 📝 **Detailed Logging**: Clear output showing what's being resolved

## Installation

```bash
# Install globally
npm install -g @cjkihl/changeset-dep-resolver

# Or use with npx
npx @cjkihl/changeset-dep-resolver
```

## Usage

### Resolve Dependencies

Before publishing, resolve all workspace dependencies:

```bash
# Resolve dependencies in current directory
resolve-deps resolve

# Or with npx
npx @cjkihl/changeset-dep-resolver resolve
```

### Restore Dependencies

After publishing, restore the original workspace dependencies:

```bash
# Restore original dependencies
resolve-deps restore

# Or with npx
npx @cjkihl/changeset-dep-resolver restore
```

## How It Works

1. **Reads Changesets**: Analyzes your changesets to understand which packages are being released
2. **Assembles Release Plan**: Uses changesets to determine new versions for packages
3. **Scans Dependencies**: Finds all `workspace:` dependencies in package.json files
4. **Resolves Versions**: Converts workspace dependencies to specific versions:
   - For packages being released: Uses the new version from the release plan
   - For local packages: Uses the current local version
   - For external packages: Fetches the latest version from npm
5. **Creates Backup**: Saves original package.json files before making changes
6. **Updates Files**: Writes the resolved dependencies back to package.json files

## Supported Dependency Types

The tool processes all dependency types:
- `dependencies`
- `devDependencies`
- `peerDependencies`
- `optionalDependencies`

## Workspace Range Resolution

| Workspace Range | Resolution Strategy |
|----------------|-------------------|
| `workspace:*` | Exact version |
| `workspace:^` | Caret range with resolved version |
| `workspace:~` | Tilde range with resolved version |
| `workspace:1.0.0` | Caret range with resolved version |

## Example

### Before Resolution
```json
{
  "dependencies": {
    "@cjkihl/utils": "workspace:*",
    "@cjkihl/core": "workspace:^",
    "lodash": "workspace:~"
  }
}
```

### After Resolution
```json
{
  "dependencies": {
    "@cjkihl/utils": "1.2.3",
    "@cjkihl/core": "^2.0.0",
    "lodash": "~4.17.21"
  }
}
```

## Integration with Changesets

This tool is designed to work seamlessly with the changesets workflow:

```bash
# 1. Create changesets
changeset

# 2. Version packages
changeset version

# 3. Resolve dependencies (this tool)
resolve-deps resolve

# 4. Publish packages
changeset publish

# 5. Restore dependencies (optional)
resolve-deps restore
```

## Backup and Restore

The tool automatically creates a backup file (`.workspace-deps-backup.json`) containing:
- List of modified packages
- Original package.json contents
- Timestamp of the operation

You can restore the original dependencies at any time using the `restore` command.

## Error Handling

The tool provides detailed error messages and handles various edge cases:
- Missing packages on npm
- Invalid workspace ranges
- File system errors
- Changesets configuration issues

## Requirements

- Node.js >= 18.0.0
- Changesets setup in your monorepo
- Workspace packages with `workspace:` dependencies

## License

MIT 