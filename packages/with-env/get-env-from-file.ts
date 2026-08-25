import { accessSync, readFileSync } from "node:fs";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { findRoot, findRootSync } from "@cjkihl/find-root";
import dotenv, { type DotenvParseOutput } from "dotenv";

/**
 * Options for {@link getEnvs} / {@link getEnvsSync}
 */
export interface GetEnvsOptions {
	/**
	 * Monorepo root directory to read env files from.
	 * When omitted, the root is auto-detected via lockfile search
	 * ({@link findRoot} / {@link findRootSync}).
	 */
	root?: string;
}

/**
 * Finds and reads environment variables from multiple env files, merging them in order.
 * Later files override variables from earlier files.
 *
 * @param envFileNames - Array of environment file names to search for (e.g., ['.env.default', '.env.local'])
 * @param options - Optional settings (e.g. explicit root directory)
 * @returns Parsed environment variables merged from all found files, or null if no files are found
 * @throws {Error} When there's an issue finding the project root
 */
export async function getEnvs(
	envFileNames: readonly string[] | undefined,
	options: GetEnvsOptions = {},
): Promise<DotenvParseOutput | null> {
	if (!envFileNames || !envFileNames.length) {
		return null;
	}

	const root = options.root ?? (await findRoot()).root;

	// Find all existing env files
	const existingFiles = await findAllExistingFiles(root, envFileNames);

	if (existingFiles.length === 0) {
		return null;
	}

	// Merge environment variables from all files
	const mergedEnv: DotenvParseOutput = {};

	for (const filePath of existingFiles) {
		try {
			const content = await readFile(filePath, "utf-8");
			if (content.trim()) {
				const fileEnv = dotenv.parse(content);
				// Merge with existing variables (later files override earlier ones)
				Object.assign(mergedEnv, fileEnv);
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(
				`Failed to read environment file '${filePath}': ${errorMessage}`,
			);
			// Continue with other files even if one fails
		}
	}

	return Object.keys(mergedEnv).length > 0 ? mergedEnv : null;
}

/**
 * Synchronous version of {@link getEnvs}. Use in sync-only contexts
 * (e.g. Expo `app.config.js`, which is evaluated via require-from-string).
 *
 * @param envFileNames - Array of environment file names to search for (e.g., ['.env.default', '.env.local'])
 * @param options - Optional settings (e.g. explicit root directory)
 * @returns Parsed environment variables merged from all found files, or null if no files are found
 * @throws {Error} When there's an issue finding the project root
 */
export function getEnvsSync(
	envFileNames: readonly string[] | undefined,
	options: GetEnvsOptions = {},
): DotenvParseOutput | null {
	if (!envFileNames || !envFileNames.length) {
		return null;
	}

	const root = options.root ?? findRootSync().root;

	// Find all existing env files
	const existingFiles: string[] = [];
	for (const fileName of envFileNames) {
		const filePath = join(root, fileName);
		try {
			accessSync(filePath);
			existingFiles.push(filePath);
		} catch {
			// File doesn't exist, continue to next
		}
	}

	if (existingFiles.length === 0) {
		return null;
	}

	// Merge environment variables from all files
	const mergedEnv: DotenvParseOutput = {};

	for (const filePath of existingFiles) {
		try {
			const content = readFileSync(filePath, "utf-8");
			if (content.trim()) {
				const fileEnv = dotenv.parse(content);
				// Merge with existing variables (later files override earlier ones)
				Object.assign(mergedEnv, fileEnv);
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(
				`Failed to read environment file '${filePath}': ${errorMessage}`,
			);
			// Continue with other files even if one fails
		}
	}

	return Object.keys(mergedEnv).length > 0 ? mergedEnv : null;
}

/**
 * Finds all existing files from a list of possible file names.
 *
 * @param rootDir - The root directory to search in
 * @param fileNames - Array of file names to check
 * @returns Array of paths to all existing files, in the order they were specified
 */
async function findAllExistingFiles(
	rootDir: string,
	fileNames: readonly string[],
): Promise<string[]> {
	const existingFiles: string[] = [];

	for (const fileName of fileNames) {
		const filePath = join(rootDir, fileName);

		try {
			await access(filePath);
			existingFiles.push(filePath);
		} catch {
			// File doesn't exist, continue to next
		}
	}

	return existingFiles;
}
