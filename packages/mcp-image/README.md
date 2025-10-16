# 🖼️ @cjkihl/sharp-mcp

> Sharp-based MCP server for AI-powered image processing

Let your AI assistant handle image conversions, resizing, and favicon/PWA icon generation. Built on Sharp and libvips—no ImageMagick required.

## Features

- **Zero configuration** - Works out of the box
- **Fast processing** - Powered by Sharp and libvips
- **Format conversion** - WebP, AVIF, PNG, JPEG, and more
- **Smart resizing** - Batch resize or create thumbnails
- **Icon generation** - Complete favicon and PWA icon sets in one command

## Installation

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "sharp": {
      "command": "npx",
      "args": ["@cjkihl/sharp-mcp"],
      "transport": "stdio"
    }
  }
}
```

Or run directly:

```bash
npx @cjkihl/sharp-mcp

bunx @cjkihl/sharp-mcp
```

## Available Tools

### `sharp.convert`
Convert images between formats: PNG, WebP, JPEG, AVIF, and more.

### `sharp.resize`
Resize images to specific dimensions or create thumbnails with quality presets.

### `sharp.iconSet`
Generate complete favicon and PWA icon sets from a single image. Outputs all standard sizes (16px, 32px, 180px, 192px, 512px, etc.) for web, iOS, and Android.

## Requirements

- Node.js >= 18
- Sharp (automatically installs platform-specific libvips binaries)

## Resources

Built with the [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk).
