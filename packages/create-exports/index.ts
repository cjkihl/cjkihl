#!/usr/bin/env bun

import node_fs from "node:fs";
import node_path from "node:path";
import fg from "fast-glob";
import type { PackageJson } from "type-fest";
import { readConfigFile, parseJsonConfigFileContent, sys } from "typescript";

/**
 * Options for configuring the exports generation
 */
interface CreateExportsOptions {
	/** Path to package.json file */
	packageJsonPath?: string;
	/** Path to tsconfig.json file */
	tsconfigPath?: string;
}

/**
 * Creates exports configuration for a TypeScript package
 * @param options Configuration options
 */
export async function createExports(options: CreateExportsOptions = {}) {
	// Read and validate package.json
	const pkgPath = options.packageJsonPath ?? node_path.join(process.cwd(), "package.json");
	if (!node_fs.existsSync(pkgPath)) {
		throw new Error("No package.json found");
	}
	const pkg: PackageJson = JSON.parse(node_fs.readFileSync(pkgPath, "utf8"));

	// Read and validate tsconfig.json
	const tsconfigPath = options.tsconfigPath ?? node_path.join(process.cwd(), "tsconfig.json");
	const configFile = readConfigFile(tsconfigPath, sys.readFile);
    
	if (configFile.error) {
		throw new Error(`Error reading tsconfig: ${configFile.error.messageText}`);
	}

	// Parse the config file with proper path resolution
	const parsedTsConfig = parseJsonConfigFileContent(
		configFile.config,
		sys,
		node_path.dirname(tsconfigPath)
	);

	// Get output directories from tsconfig
	const outDir = parsedTsConfig.options.outDir || "dist";
	const declarationDir = parsedTsConfig.options.declarationDir || "dist";
	
	// Find all public export files (files ending with .pub.ts or .pub.tsx)
	const publicFiles: string[] = await fg(["**/*.pub.ts", "**/*.pub.tsx"], {
		cwd: process.cwd(),
		deep: 2,
		ignore: ["**/node_modules/**"],
		dot: false,
	});

	// Find all binary files (files ending with .bin.ts or .bin.tsx)
	const binFiles: string[] = await fg(["**/*.bin.ts", "**/*.bin.tsx"], {
		cwd: process.cwd(),
		dot: false,
		deep: 2,
		ignore: ["**/node_modules/**"],
	});

	// Generate exports object for public files
	const exports: Record<string, { types: string; default: string }> = {};
	for (const file of publicFiles) {
		const relativePath = node_path.relative(process.cwd(), file);
		const parsedPath = relativePath.replace(/\.pub\.(ts|tsx)$/, "");

		// Handle index files in any directory
		const segments = parsedPath.split("/");
		const isIndex = segments[segments.length - 1] === "index";
		const name = isIndex
			? segments.length === 1
				? "." // Root index
				: `./${segments.slice(0, -1).join("/")}` // Nested index
			: `./${parsedPath}`; // Regular file

		exports[name] = {
			types: `${declarationDir}/${parsedPath}.pub.d.ts`,
			default: `${outDir}/${parsedPath}.pub.js`,
		};
	}

	// Sort the exports object by keys for consistent output
	const sortedExports: Record<string, { types: string; default: string }> =
		Object.fromEntries(
			Object.entries(exports).sort(([a], [b]) => a.localeCompare(b)),
		);

	// Update package.json with sorted exports
	pkg.exports = sortedExports;

	// Generate bin object for binary files
	const bin: Record<string, string> = {};
	for (const file of binFiles) {
		const relativePath = node_path.relative(process.cwd(), file);
		const parsedPath = relativePath.replace(/\.bin\.(ts|tsx)$/, "");
		const name = parsedPath
			.split("/")
			.pop()
			?.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "");

		if (!name) {
			throw new Error(`Invalid name for binary file: ${file}`);
		}

		bin[name] = `${outDir}/${parsedPath}.bin.js`;
	}

	// Update package.json with sorted bin entries if any exist
	if (Object.keys(bin).length) {
		const sortedBin: Record<string, string> = Object.fromEntries(
			Object.entries(bin).sort(([a], [b]) => a.localeCompare(b)),
		);
		pkg.bin = sortedBin;
	} else {
		pkg.bin = undefined;
	}

	// Write updated package.json back to disk
	node_fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");

	console.log("Exports and binaries generated successfully");
}