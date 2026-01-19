/**
 * Gemini image analysis (generateContent) via REST.
 *
 * Usage:
 *   GEMINI_API_KEY="..." bun gemini-image-analyze.ts --prompt "..." img1.jpg [img2.png ...]
 */
export {};

type InlineDataPart = {
	inline_data: {
		mime_type: string;
		data: string;
	};
};

type TextPart = { text: string };

type GeminiResponse = {
	candidates?: Array<{
		content?: { parts?: Array<{ text?: string }> };
	}>;
};

function writeStdout(s: string): void {
	process.stdout.write(s.endsWith("\n") ? s : `${s}\n`);
}

function writeStderr(s: string): void {
	process.stderr.write(s.endsWith("\n") ? s : `${s}\n`);
}

function usage(exitCode: number): never {
	const msg = `
Usage:
  GEMINI_API_KEY="..." bun .claude/skills/gemini-image-analysis/scripts/gemini-image-analyze.ts \\
    --prompt "Caption this image." \\
    /path/to/image.jpg [/path/to/image2.png ...]

Options:
  --prompt <text>     Prompt text (default: "Caption this image.")
  --model <model>     Model (default: "gemini-3-flash-preview")
  --json              Print full JSON response
  --help              Show help
`;
	writeStdout(msg.trim());
	process.exit(exitCode);
}

function parseFlagValue(
	args: string[],
	i: number,
): { value: string; nextIndex: number } | null {
	const cur = args[i] ?? "";
	const next = args[i + 1];
	if (cur.includes("=")) {
		const [, value] = cur.split("=", 2);
		if (value) return { nextIndex: i + 1, value };
		return null;
	}
	if (!next || next.startsWith("--")) return null;
	return { nextIndex: i + 2, value: next };
}

function mimeTypeForPath(path: string, fallback?: string): string | null {
	const ext = path.toLowerCase().split(".").pop() ?? "";
	const map: Record<string, string> = {
		gif: "image/gif",
		jpeg: "image/jpeg",
		jpg: "image/jpeg",
		png: "image/png",
		webp: "image/webp",
	};
	if (map[ext]) return map[ext];
	if (fallback?.startsWith("image/")) return fallback;
	return null;
}

function extractText(resp: GeminiResponse): string {
	const parts = resp.candidates?.[0]?.content?.parts ?? [];
	return parts
		.map((p) => p.text)
		.filter((t): t is string => Boolean(t?.trim()))
		.join("\n");
}

const args = Bun.argv.slice(2);
let promptText = "Caption this image.";
let model = "gemini-3-flash-preview";
let printJson = false;
const imagePaths: string[] = [];

for (let i = 0; i < args.length; ) {
	const a = args[i] ?? "";
	if (a === "--help") usage(0);
	if (a === "--json") {
		printJson = true;
		i += 1;
		continue;
	}
	if (a === "--prompt" || a.startsWith("--prompt=")) {
		const parsed = parseFlagValue(args, i);
		if (!parsed) {
			writeStderr("Error: --prompt requires a value.");
			usage(1);
		}
		promptText = parsed.value;
		i = parsed.nextIndex;
		continue;
	}
	if (a === "--model" || a.startsWith("--model=")) {
		const parsed = parseFlagValue(args, i);
		if (!parsed) {
			writeStderr("Error: --model requires a value.");
			usage(1);
		}
		model = parsed.value;
		i = parsed.nextIndex;
		continue;
	}
	if (a.startsWith("--")) {
		writeStderr(`Error: unknown option: ${a}`);
		usage(1);
	}
	imagePaths.push(a);
	i += 1;
}

if (imagePaths.length === 0) {
	writeStderr("Error: provide at least one image path.");
	usage(1);
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
	writeStderr(
		'Error: missing GEMINI_API_KEY in environment. Example: GEMINI_API_KEY="..." bun ...',
	);
	process.exit(1);
}

const parts: Array<InlineDataPart | TextPart> = [];

for (const imagePath of imagePaths) {
	const file = Bun.file(imagePath);
	if (!(await file.exists())) {
		writeStderr(`Error: file not found: ${imagePath}`);
		process.exit(1);
	}

	const mimeType = mimeTypeForPath(imagePath, file.type);
	if (!mimeType) {
		writeStderr(`Error: unsupported image type for: ${imagePath}`);
		writeStderr("Supported: .jpg, .jpeg, .png, .webp, .gif");
		process.exit(1);
	}

	const ab = await file.arrayBuffer();
	const b64 = Buffer.from(ab).toString("base64");

	parts.push({
		inline_data: {
			data: b64,
			mime_type: mimeType,
		},
	});
}

parts.push({ text: promptText });

const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
const body = {
	contents: [
		{
			parts,
		},
	],
};

const res = await fetch(url, {
	body: JSON.stringify(body),
	headers: {
		"content-type": "application/json",
		"x-goog-api-key": apiKey,
	},
	method: "POST",
});

const text = await res.text();
if (!res.ok) {
	writeStderr(
		`Error: Gemini API request failed (${res.status} ${res.statusText})`,
	);
	writeStderr(text);
	process.exit(1);
}

if (printJson) {
	writeStdout(text);
	process.exit(0);
}

let json: GeminiResponse;
try {
	json = JSON.parse(text) as GeminiResponse;
} catch {
	writeStdout(text);
	process.exit(0);
}

const out = extractText(json);
writeStdout(out || text);
