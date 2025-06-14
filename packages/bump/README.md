# @cjkihl/bump

A powerful version bumping and release tool for monorepos. Automatically handles version updates, git operations, and GitHub releases.

## Prerequisites

- Node.js >= 18.0.0
- Bun package manager
- [GitHub CLI](https://cli.github.com/) (`gh`) installed and authenticated
- Git configured with proper credentials

## Installation

```bash
# Using bun
bun add -g @cjkihl/bump

# Using npm
npm install -g @cjkihl/bump
```

## Usage

The tool supports various options for version bumping and release management:

```bash
# Bump patch version (default)
bump

# Bump major version
bump --major

# Bump minor version
bump --minor

# Preview changes without making them
bump --dry-run

# Skip git operations
bump --skip-git

# Skip GitHub release creation
bump --skip-release

# Select specific packages to bump
bump --packages @org/pkg1,@org/pkg2
```

## Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `--major` | Bump major version (1.0.0 -> 2.0.0) | false |
| `--minor` | Bump minor version (1.0.0 -> 1.1.0) | false |
| `--patch` | Bump patch version (1.0.0 -> 1.0.1) | true |
| `--dry-run` | Show what would be done without making changes | false |
| `--skip-git` | Skip git operations (commit, push, tag) | false |
| `--skip-release` | Skip GitHub release creation | false |
| `--packages` | Comma-separated list of package names to bump | all packages |

## Common Troubleshooting

### GitHub CLI Issues
- **Error**: "gh command not found"
  - Solution: Install GitHub CLI following [official instructions](https://cli.github.com/)
- **Error**: "Authentication required"
  - Solution: Run `gh auth login` and follow the prompts

### Git Issues
- **Error**: "Git working directory is not clean"
  - Solution: Commit or stash your changes before running bump
- **Error**: "Failed to push to remote"
  - Solution: Ensure you have proper git credentials and permissions

### Version Issues
- **Error**: "Packages have different versions"
  - Solution: Use `--packages` to select specific packages or align versions manually
- **Error**: "Invalid version format"
  - Solution: Ensure all package.json files have valid semver versions

### Package Issues
- **Error**: "No packages found"
  - Solution: Check your workspace configuration in root package.json
- **Error**: "Package not found"
  - Solution: Verify package names in --packages option match your workspace

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
