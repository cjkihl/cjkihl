import type { MetaData } from "./types.js";

function addHeader(name: string) {
	const border = `# ${"~".repeat(60)}`;
	const nameLine = `Env file for ${name}`;
	return `
${border}
# ${nameLine}
#                                                                                               
# Don't forget to add to .gitignore.    
#                                                            
${border}
`;
}

function createGroupHeader(groupName: string): string {
	const border = "═".repeat(groupName.length + 4);
	const padding = " ".repeat((border.length - groupName.length) / 2 + 1);
	return `# ╔${border}╗\n# ${padding}${groupName}${padding}\n# ╚${border}╝\n`;
}

export default function createEnvFile(
	projectName: string,
	env: Record<string, unknown> & { _meta?: MetaData },
	existingValues: Record<string, string> = {},
): string {
	if (
		!("_meta" in env) ||
		typeof env._meta !== "object" ||
		env._meta === null
	) {
		throw new Error(`Invalid metadata: ${env._meta} for ${projectName}`);
	}
	const meta = env._meta as MetaData;
	let output = addHeader(projectName);

	const added: Record<string, boolean> = {};

	const addVariables = (keys: string[], group: string) => {
		const groupMeta = meta[group];
		if (!groupMeta?.v) return;

		for (const key of keys) {
			const v = groupMeta.v[key];
			if (!v) continue;
			const c: string[] = [];
			if (v.c) c.push(v.c);
			if (v.o) c.push("(Optional)");
			if (v.def) c.push(`(Default: ${v.def})`);
			if (c.length) output += `# ${c.join(" ")}\n`;
			const value = existingValues[key] || v.def;
			output += `${v.o && !value ? "# " : ""}${key}=${value ? `"${value}"` : ""}\n\n`;
			// Mark as added regardless of value
			added[key] = true;
		}
	};

	for (const group of Object.keys(meta).reverse()) {
		output += `\n${createGroupHeader(group)}`;
		addVariables(Object.keys(meta[group]?.v || {}), group);
	}

	const other: Record<string, string> = {};
	for (const [k, v] of Object.entries(existingValues)) {
		if (added[k] === undefined) {
			other[k] = v;
		}
	}

	if (Object.keys(other).length > 0) {
		output += createGroupHeader("Other");
		for (const [k, v] of Object.entries(other)) {
			output += `${k}=${v ? `"${v}"` : ""}\n\n`;
		}
	}

	return `${output.trim()}\n`;
}
