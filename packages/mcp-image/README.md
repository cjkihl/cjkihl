<div align="center">

# @cjkihl/mcp-image

**Sharp-based MCP server for AI-powered image processing**

[![npm version](https://img.shields.io/npm/v/@cjkihl/mcp-image?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/@cjkihl/mcp-image)
[![license](https://img.shields.io/npm/l/@cjkihl/mcp-image?style=for-the-badge)](./LICENSE)

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Sharp](https://img.shields.io/badge/Sharp-99CC00?style=for-the-badge&logo=sharp&logoColor=white)](https://sharp.pixelplumbing.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-0066CC?style=for-the-badge&logo=protocol&logoColor=white)](https://modelcontextprotocol.io/)

</div>

---

Let your AI assistant handle image conversions, resizing, and favicon/PWA icon generation. Built on Sharp and libvips—no ImageMagick required.

---

## ✨ Features

- **Zero configuration** - Works out of the box
- **Fast processing** - Powered by Sharp and libvips
- **Format conversion** - WebP, AVIF, PNG, JPEG, and more
- **Smart resizing** - Batch resize or create thumbnails
- **Icon generation** - Complete favicon and PWA icon sets in one command

---

## 📦 Installation

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "sharp": {
      "command": "npx",
      "args": ["@cjkihl/mcp-image"],
      "transport": "stdio"
    }
  }
}
```

Or run directly:

```bash
npx @cjkihl/mcp-image

bunx @cjkihl/mcp-image
```

---

## 🛠️ Available Tools

### 🔄 `convertImage`
Convert images between formats: PNG, WebP, JPEG, AVIF, and more.

### 📐 `resizeImage`
Resize images to specific dimensions or create thumbnails with quality presets.

### 🎨 `generateIconSet`
Generate complete favicon and PWA icon sets from a single image. Outputs all standard sizes (16px, 32px, 180px, 192px, 512px, etc.) for web, iOS, and Android.

---

## 📋 Requirements

- Node.js >= 18
- Sharp (automatically installs platform-specific libvips binaries)

---

## 📚 Resources

- 🔗 [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- 🔗 [Sharp Documentation](https://sharp.pixelplumbing.com/)
- 🔗 [Model Context Protocol](https://modelcontextprotocol.io/)

---

<div align="center">

### 💚 Support This Project

If you find this package useful, consider [sponsoring me on GitHub](https://github.com/sponsors/cjkihl)!

Every coffee helps fuel more open source projects! ☕

---

**Made with ❤️ by [CJ Kihl](https://github.com/cjkihl)**

</div>
