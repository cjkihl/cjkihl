#!/usr/bin/env bun

import node_fs from "node:fs";
import node_path from "node:path";
import fg from "fast-glob";
import type { PackageJson } from "type-fest";
import { readConfigFile, parseJsonConfigFileContent, sys } from "typescript";

/**
 * Options for configuring the exports generation
 */
export interface CreateExportsOptions {
	/** Path to package.json file */
	packageJsonPath?: string;
	/** Path to tsconfig.json file */
	tsconfigPath?: string;
	/** If true, only show what would be changed without writing to package.json */
	dryRun?: boolean;
}

/**
 * Result of parsing a TypeScript file path
 */
export interface ParsedFilePath {
	/** The relative path without the extension */
	parsedPath: string;
	/** The name for the export/bin entry */
	name: string;
}

/**
 * Reads and parses package.json file
 */
export function readPackageJson(pkgPath: string): PackageJson {
	if (!node_fs.existsSync(pkgPath)) {
		throw new Error("No package.json found");
	}
	return JSON.parse(node_fs.readFileSync(pkgPath, "utf8"));
}

/**
 * Reads and parses tsconfig.json file
 */
export function readTsConfig(tsconfigPath: string) {
	const configFile = readConfigFile(tsconfigPath, sys.readFile);
    
	if (configFile.error) {
		throw new Error(`Error reading tsconfig: ${configFile.error.messageText}`);
	}

	return parseJsonConfigFileContent(
		configFile.config,
		sys,
		node_path.dirname(tsconfigPath)
	);
}

/**
 * Finds all public export files in the project
 */
export async function findPublicFiles(cwd: string): Promise<string[]> {
	return fg(["**/*.pub.ts", "**/*.pub.tsx"], {
		cwd,
		deep: 2,
		ignore: ["**/node_modules/**"],
		dot: false,
	});
}

/**
 * Finds all binary files in the project
 */
export async function findBinaryFiles(cwd: string): Promise<string[]> {
	return fg(["**/*.bin.ts", "**/*.bin.tsx"], {
		cwd,
		dot: false,
		deep: 2,
		ignore: ["**/node_modules/**"],
	});
}

/**
 * Parses a file path for exports
 */
export function parseExportPath(file: string, cwd: string): ParsedFilePath {
	// Get the relative path from the current working directory
	const relativePath = node_path.relative(cwd, file);
	// Remove the .pub.ts or .pub.tsx extension
	const parsedPath = relativePath.replace(/\.pub\.(ts|tsx)$/, "");

	// Handle index files in any directory
	const segments = parsedPath.split("/");
	const isIndex = segments[segments.length - 1] === "index";
	const name = isIndex
		? segments.length === 1
			? "." // Root index
			: `./${segments.slice(0, -1).join("/")}` // Nested index
		: `./${parsedPath}`; // Regular file

	return { parsedPath, name };
}

/**
 * Parses a file path for binary files
 */
export function parseBinaryPath(file: string, cwd: string): ParsedFilePath {
	// Get the relative path from the current working directory
	const relativePath = node_path.relative(cwd, file);
	// Remove the .bin.ts or .bin.tsx extension
	const parsedPath = relativePath.replace(/\.bin\.(ts|tsx)$/, "");
	// Get the last segment of the path and convert it to a valid bin name
	const name = parsedPath
		.split("/")
		.pop()
		?.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

	if (!name) {
		throw new Error(`Invalid name for binary file: ${file}`);
	}

	return { parsedPath, name };
}

/**
 * Generates exports configuration from public files
 */
export function generateExports(
	files: string[],
	cwd: string,
	outDir: string,
	declarationDir: string
): Record<string, { types: string; default: string }> {
	const exports: Record<string, { types: string; default: string }> = {};
	
	for (const file of files) {
		const { parsedPath, name } = parseExportPath(file, cwd);
		exports[name] = {
			types: `${declarationDir}/${parsedPath}.pub.d.ts`,
			default: `${outDir}/${parsedPath}.pub.js`,
		};
	}

	return Object.fromEntries(
		Object.entries(exports).sort(([a], [b]) => a.localeCompare(b))
	);
}

/**
 * Generates bin configuration from binary files
 */
export function generateBin(
	files: string[],
	cwd: string,
	outDir: string
): Record<string, string> {
	const bin: Record<string, string> = {};
	
	for (const file of files) {
		const { parsedPath, name } = parseBinaryPath(file, cwd);
		bin[name] = `${outDir}/${parsedPath}.bin.js`;
	}

	return Object.fromEntries(
		Object.entries(bin).sort(([a], [b]) => a.localeCompare(b))
	);
}

/**
 * Updates package.json with new exports and bin entries
 */
export function updatePackageJson(
	pkg: PackageJson,
	exports: Record<string, { types: string; default: string }>,
	bin: Record<string, string>
): PackageJson {
	const updatedPkg = { ...pkg };
	updatedPkg.exports = exports;
	updatedPkg.bin = Object.keys(bin).length ? bin : undefined;
	return updatedPkg;
}

/**
 * Creates exports configuration for a TypeScript package
 */
export async function createExports(options: CreateExportsOptions = {}) {
	const cwd = process.cwd();
	const pkgPath = options.packageJsonPath ?? node_path.join(cwd, "package.json");
	const tsconfigPath = options.tsconfigPath ?? node_path.join(cwd, "tsconfig.json");

	// Read configuration files
	const pkg = readPackageJson(pkgPath);
	const parsedTsConfig = readTsConfig(tsconfigPath);

	// Get output directories
	const outDir = parsedTsConfig.options.outDir || "dist";
	const declarationDir = parsedTsConfig.options.declarationDir || "dist";
	
	// Find files
	const publicFiles = await findPublicFiles(cwd);
	const binFiles = await findBinaryFiles(cwd);

	// Generate configurations
	const exports = generateExports(publicFiles, cwd, outDir, declarationDir);
	const bin = generateBin(binFiles, cwd, outDir);

	// Create updated package.json
	const updatedPkg = updatePackageJson(pkg, exports, bin);

	if (options.dryRun) {
		console.log("=== DRY RUN - No changes will be written ===");
		console.log("\nFound public files:");
		for (const file of publicFiles) {
			console.log(`- ${file}`);
		}
		
		console.log("\nFound binary files:");
		for (const file of binFiles) {
			console.log(`- ${file}`);
		}
		
		console.log("\nExports that would be added:");
		console.log(JSON.stringify(exports, null, 2));
		
		if (Object.keys(bin).length) {
			console.log("\nBin entries that would be added:");
			console.log(JSON.stringify(bin, null, 2));
		}

		// Compare with existing package.json
		const currentExports = pkg.exports ? JSON.stringify(pkg.exports, null, 2) : "{}";
		const newExports = JSON.stringify(exports, null, 2);
		const currentBin = pkg.bin ? JSON.stringify(pkg.bin, null, 2) : "{}";
		const newBin = Object.keys(bin).length ? JSON.stringify(bin, null, 2) : "{}";

		if (currentExports !== newExports || currentBin !== newBin) {
			console.log("\nChanges that would be made to package.json:");
			if (currentExports !== newExports) {
				console.log("\nExports changes:");
				console.log("Current:", currentExports);
				console.log("New:", newExports);
			}
			if (currentBin !== newBin) {
				console.log("\nBin changes:");
				console.log("Current:", currentBin);
				console.log("New:", newBin);
			}
		} else {
			console.log("\nNo changes would be made to package.json");
		}
		return;
	}

	// Write updated package.json back to disk
	node_fs.writeFileSync(pkgPath, `${JSON.stringify(updatedPkg, null, 2)}\n`, "utf8");

	console.log("Exports and binaries generated successfully");
}