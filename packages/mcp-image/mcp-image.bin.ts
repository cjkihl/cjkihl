#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { convertImage, generateIconSet, resizeWithFit } from "./sharp-tools.ts";

const convertShape = {
	background: z
		.string()
		.optional()
		.describe(
			"Background color for images with transparency when flattening. Use CSS color names (e.g., 'white', 'black') or hex codes (e.g., '#ffffff')",
		),
	colorspace: z
		.enum(["srgb"])
		.optional()
		.describe(
			"Convert image to specified colorspace. Currently only 'srgb' is supported",
		),
	flatten: z
		.boolean()
		.optional()
		.describe(
			"Remove alpha channel and replace with background color. Requires background to be set",
		),
	format: z
		.enum(["png", "jpeg", "jpg", "webp", "avif", "tiff"])
		.optional()
		.describe(
			"Output image format. If not specified, format is inferred from outputPath extension",
		),
	inputPath: z
		.string()
		.describe(
			"Path to the input image file (absolute or relative to current directory)",
		),
	outputPath: z
		.string()
		.describe(
			"Path where the converted image will be saved (absolute or relative to current directory)",
		),
	quality: z
		.number()
		.int()
		.min(1)
		.max(100)
		.optional()
		.describe(
			"Image quality (1-100). Higher values = better quality but larger file size. Only applies to lossy formats (jpeg, webp, avif)",
		),
};

const resizeShape = {
	background: z
		.string()
		.optional()
		.describe(
			"Background color for letterboxing/pillarboxing. Use CSS color names or hex codes",
		),
	fit: z
		.enum(["contain", "cover", "fill", "inside", "outside"])
		.optional()
		.describe(
			"How the image should fit the target dimensions:\n- 'contain': Preserve aspect ratio, ensure image fits within dimensions\n- 'cover': Preserve aspect ratio, ensure image covers dimensions (may crop)\n- 'fill': Ignore aspect ratio, stretch to exact dimensions\n- 'inside': Resize only if larger than dimensions\n- 'outside': Resize only if smaller than dimensions\nDefaults to 'inside'",
		),
	format: z
		.enum(["png", "jpeg", "jpg", "webp", "avif", "tiff"])
		.optional()
		.describe("Output format. If not specified, uses input format"),
	height: z
		.number()
		.int()
		.positive()
		.optional()
		.describe(
			"Target height in pixels. Either width or height must be specified. Both can be provided",
		),
	inputPath: z
		.string()
		.describe(
			"Path to the input image file (absolute or relative to current directory)",
		),
	outputPath: z
		.string()
		.describe(
			"Path where the resized image will be saved (absolute or relative to current directory)",
		),
	position: z
		.union([z.string(), z.number()])
		.optional()
		.describe(
			"Position for cropping when using 'cover' fit. Can be: 'center', 'top', 'right top', 'right', 'right bottom', 'bottom', 'left bottom', 'left', 'left top', or a number for entropy-based cropping",
		),
	quality: z
		.number()
		.int()
		.min(1)
		.max(100)
		.optional()
		.describe("Image quality (1-100) for lossy formats"),
	width: z
		.number()
		.int()
		.positive()
		.optional()
		.describe(
			"Target width in pixels. Either width or height must be specified. Both can be provided",
		),
};

const iconSetShape = {
	androidSizes: z
		.array(z.number().int().positive())
		.optional()
		.describe(
			"Array of sizes for Android Chrome icons (e.g., [192, 512]). Generates android-chrome-{size}x{size}.png files. Defaults to [192, 512]",
		),
	appleSizes: z
		.array(z.number().int().positive())
		.optional()
		.describe(
			"Array of sizes for Apple touch icons (e.g., [180]). Generates apple-touch-icon-{size}x{size}.png files. Defaults to [180]",
		),
	background: z
		.string()
		.optional()
		.describe(
			"Background color for padding/letterboxing when using 'contain' fit. Defaults to 'white'",
		),
	ico: z
		.boolean()
		.optional()
		.describe(
			"Generate a favicon.ico file from PNG versions. Defaults to true",
		),
	icoSizes: z
		.array(z.number().int().positive())
		.optional()
		.describe(
			"Sizes to include in the .ico file (e.g., [16, 32, 48]). Defaults to [16, 32, 48]",
		),
	maskable: z
		.boolean()
		.optional()
		.describe(
			"Generate maskable icons for Android (adds '-maskable' suffix to filenames). Defaults to false",
		),
	outDir: z
		.string()
		.describe(
			"Directory where generated icons will be saved (will be created if it doesn't exist)",
		),
	quality: z
		.number()
		.int()
		.min(1)
		.max(100)
		.optional()
		.describe("PNG quality (1-100). Defaults to 90"),
	sizesPng: z
		.array(z.number().int().positive())
		.optional()
		.describe(
			"Array of sizes for standard favicons (e.g., [16, 32, 48]). Generates favicon-{size}x{size}.png files. Defaults to [16, 32, 48]",
		),
	sourcePath: z
		.string()
		.describe(
			"Path to source image (should be square, ideally 512x512 or larger for best results)",
		),
};

async function main() {
	const server = new McpServer({ name: "sharp", version: "0.1.0" });

	server.tool(
		"convertImage",
		"Convert an image from one format to another (png, jpeg, webp, avif, tiff). Useful for format conversion, quality optimization, or processing images with transparency. Can optionally flatten transparent images to a solid background color and convert colorspaces.",
		convertShape,
		async (args) => {
			const out = await convertImage({
				background: args.background,
				colorspace: args.colorspace,
				flatten: args.flatten,
				format: args.format,
				inputPath: args.inputPath,
				outputPath: args.outputPath,
				quality: args.quality,
			});
			return {
				content: [
					{ text: JSON.stringify({ files: [out] }, null, 2), type: "text" },
				],
			};
		},
	);

	server.tool(
		"resizeImage",
		"Resize an image to specified dimensions with various fit modes. Supports aspect-ratio preserving resizing, cropping, stretching, and conditional resizing. Perfect for creating thumbnails, optimizing images for web, or generating responsive image variants. At least one dimension (width or height) must be specified.",
		resizeShape,
		async (args) => {
			if (args.width == null && args.height == null)
				throw new Error("width or height is required");
			const out = await resizeWithFit({
				background: args.background,
				fit: args.fit,
				format: args.format,
				height: args.height,
				inputPath: args.inputPath,
				outputPath: args.outputPath,
				position: args.position,
				quality: args.quality,
				width: args.width,
			});
			return {
				content: [
					{ text: JSON.stringify({ files: [out] }, null, 2), type: "text" },
				],
			};
		},
	);

	server.tool(
		"generateIconSet",
		"Generate a complete set of web icons and favicons from a single source image. Creates standard favicons, Apple touch icons, Android Chrome icons, and a multi-size .ico file. The source should be a square image, ideally 512x512px or larger. Outputs all required icon files for modern web apps and PWAs.",
		iconSetShape,
		async (args) => {
			const outDir = path.resolve(args.outDir);
			await fs.mkdir(outDir, { recursive: true });
			const files = await generateIconSet({
				androidSizes: args.androidSizes,
				appleSizes: args.appleSizes,
				background: args.background,
				ico: args.ico,
				icoSizes: args.icoSizes,
				maskable: args.maskable,
				outDir,
				quality: args.quality,
				sizesPng: args.sizesPng,
				sourcePath: args.sourcePath,
			});
			return {
				content: [{ text: JSON.stringify({ files }, null, 2), type: "text" }],
			};
		},
	);

	await server.connect(new StdioServerTransport());
}

main().catch((err) => {
	// eslint-disable-next-line no-console
	console.error(String(err?.stack || err));
	process.exit(1);
});
