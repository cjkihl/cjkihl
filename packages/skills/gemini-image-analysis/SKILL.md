---
name: gemini-image-analysis
description: Analyze one or multiple images with Gemini Flash (vision) via the generateContent REST API. Uses Bun + TypeScript to base64-encode images and print model output. Use for captioning, OCR-like extraction, UI/screenshot analysis, and multi-image comparison.
---

# Gemini Image Analysis (Bun + TypeScript)

## When to use

Use this Skill when you need to analyze **one or multiple images** (screenshots, photos, diagrams) with **Gemini Flash** via the REST API.

## Quick start

```bash
GEMINI_API_KEY="YOUR_KEY" \
bun .claude/skills/gemini-image-analysis/scripts/gemini-image-analyze.ts \
  --prompt "Caption this image." \
  /path/to/image.jpg
```

## macOS Keychain (optional)

If you store `GEMINI_API_KEY` in the macOS Keychain:

```bash
GEMINI_API_KEY="$(security find-generic-password -a "$(whoami)" -s "GEMINI_API_KEY" -w)" \
bun .claude/skills/gemini-image-analysis/scripts/gemini-image-analyze.ts \
  --prompt "Caption this image." \
  /path/to/image.jpg
```

## Multiple images

Send multiple images in one request (useful for comparison or “before/after”):

```bash
GEMINI_API_KEY="YOUR_KEY" \
bun .claude/skills/gemini-image-analysis/scripts/gemini-image-analyze.ts \
  --prompt "Compare these images and describe the differences." \
  /path/to/image1.jpg \
  /path/to/image2.png
```

## Options

- `--prompt <text>`: Text instruction for the model (default: `Caption this image.`)
- `--model <model>`: Model name (default: `gemini-3-flash-preview`)
- `--json`: Print the full JSON response instead of extracted text

## Notes

- The script reads `GEMINI_API_KEY` from the environment and never stores it.
- Supported image types: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`.
