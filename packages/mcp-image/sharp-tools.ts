import { promises as fs } from "node:fs";
import path from "node:path";
import pngToIco from "png-to-ico";
import sharp, { type Gravity } from "sharp";

type FitMode = "contain" | "cover" | "fill" | "inside" | "outside";

interface ResizeOptions {
	inputPath: string;
	outputPath: string;
	width?: number;
	height?: number;
	fit?: FitMode;
	position?: Gravity | number;
	background?: string;
	format?: string;
	quality?: number;
}

async function ensureDirForFile(filePath: string): Promise<void> {
	await fs.mkdir(path.dirname(filePath), { recursive: true });
}

function mapFit(fit?: FitMode): FitMode | undefined {
	switch (fit) {
		case "contain":
			return "contain";
		case "cover":
			return "cover";
		case "fill":
			return "fill";
		case "inside":
			return "inside";
		case "outside":
			return "outside";
		default:
			return undefined;
	}
}

export async function convertImage(input: {
	inputPath: string;
	outputPath: string;
	format?: "png" | "jpeg" | "jpg" | "webp" | "avif" | "tiff";
	quality?: number;
	background?: string;
	colorspace?: "srgb";
	flatten?: boolean;
}): Promise<string> {
	let image = sharp(input.inputPath, { failOn: "none" });
	if (input.colorspace === "srgb") image = image.toColorspace("srgb");
	if (input.flatten && input.background)
		image = image.flatten({ background: input.background });

	const format = (
		input.format ?? path.extname(input.outputPath).slice(1)
	).toLowerCase();

	switch (format) {
		case "png":
			image = image.png({ quality: input.quality });
			break;
		case "jpg":
		case "jpeg":
			image = image.jpeg({ quality: input.quality });
			break;
		case "webp":
			image = image.webp({ quality: input.quality });
			break;
		case "avif":
			image = image.avif({ quality: input.quality });
			break;
		case "tiff":
			image = image.tiff({ quality: input.quality });
			break;
		default:
			// Default to png
			image = image.png({ quality: input.quality });
	}

	await ensureDirForFile(input.outputPath);
	await image.toFile(input.outputPath);
	return input.outputPath;
}

export async function resizeWithFit(opts: ResizeOptions): Promise<string> {
	const { inputPath, outputPath, width, height, background, position } = opts;
	const fit = mapFit(opts.fit) ?? "inside";
	let image = sharp(inputPath, { failOn: "none" });
	image = image.resize({ background, fit, height, position, width });

	if (opts.format) {
		const fmt = opts.format.toLowerCase();
		if (fmt === "png") image = image.png({ quality: opts.quality });
		else if (fmt === "jpeg" || fmt === "jpg")
			image = image.jpeg({ quality: opts.quality });
		else if (fmt === "webp") image = image.webp({ quality: opts.quality });
		else if (fmt === "avif") image = image.avif({ quality: opts.quality });
		else if (fmt === "tiff") image = image.tiff({ quality: opts.quality });
	}

	await ensureDirForFile(outputPath);
	await image.toFile(outputPath);
	return outputPath;
}

export async function generateIconSet(input: {
	sourcePath: string;
	outDir: string;
	sizesPng?: number[];
	appleSizes?: number[];
	androidSizes?: number[];
	ico?: boolean;
	icoSizes?: number[];
	background?: string;
	quality?: number;
	maskable?: boolean;
}): Promise<string[]> {
	const outputs: string[] = [];
	await fs.mkdir(input.outDir, { recursive: true });

	const sizes = input.sizesPng ?? [16, 32, 48];
	const apple = input.appleSizes ?? [180];
	const android = input.androidSizes ?? [192, 512];

	for (const n of sizes) {
		const out = path.join(input.outDir, `favicon-${n}x${n}.png`);
		await sharp(input.sourcePath)
			.resize({
				background: input.background ?? "white",
				fit: "contain",
				height: n,
				width: n,
			})
			.png({ quality: input.quality ?? 90 })
			.toFile(out);
		outputs.push(out);
	}

	for (const n of apple) {
		const out = path.join(input.outDir, `apple-touch-icon-${n}x${n}.png`);
		await sharp(input.sourcePath)
			.resize({
				background: input.background ?? "white",
				fit: "contain",
				height: n,
				width: n,
			})
			.png({ quality: input.quality ?? 90 })
			.toFile(out);
		outputs.push(out);
	}

	for (const n of android) {
		const name = input.maskable
			? `android-chrome-${n}x${n}-maskable.png`
			: `android-chrome-${n}x${n}.png`;
		const out = path.join(input.outDir, name);
		await sharp(input.sourcePath)
			.resize({
				background: input.background ?? "white",
				fit: "contain",
				height: n,
				width: n,
			})
			.png({ quality: input.quality ?? 90 })
			.toFile(out);
		outputs.push(out);
	}

	if (input.ico ?? true) {
		const icoSizes = input.icoSizes ?? [16, 32, 48];
		const pngPaths: string[] = [];
		for (const n of icoSizes) {
			const p = path.join(input.outDir, `favicon-${n}x${n}.png`);
			try {
				await fs.stat(p);
			} catch {
				await sharp(input.sourcePath)
					.resize({
						background: input.background ?? "white",
						fit: "contain",
						height: n,
						width: n,
					})
					.png({ quality: input.quality ?? 90 })
					.toFile(p);
			}
			pngPaths.push(p);
		}
		const ico = await pngToIco(pngPaths);
		const icoOut = path.join(input.outDir, "favicon.ico");
		await fs.writeFile(icoOut, ico as unknown as NodeJS.ArrayBufferView);
		outputs.push(icoOut);
	}

	return outputs;
}
