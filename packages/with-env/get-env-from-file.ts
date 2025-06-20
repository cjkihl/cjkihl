import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { findRoot } from "@cjkihl/find-root";
import dotenv, { type DotenvParseOutput } from "dotenv";

/**
 * Finds and reads environment variables from the first available env file.
 *
 * @param envFileNames - Array of environment file names to search for (e.g., ['.env', '.env.local'])
 * @returns Parsed environment variables or null if no file is found or readable
 * @throws {Error} When there's an issue finding the project root
 */
export async function getEnvs(
	envFileNames: readonly string[],
): Promise<DotenvParseOutput | null> {
	if (!envFileNames.length) {
		return null;
	}

	const { root } = await findRoot();

	// Find the first existing env file
	const envFilePath = await findFirstExistingFile(root, envFileNames);

	if (!envFilePath) {
		return null;
	}

	try {
		const content = await readFile(envFilePath, "utf-8");
		return content.trim() ? dotenv.parse(content) : {};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(
			`Failed to read environment file '${envFilePath}': ${errorMessage}`,
		);
		return null;
	}
}

/**
 * Finds the first existing file from a list of possible file names.
 *
 * @param rootDir - The root directory to search in
 * @param fileNames - Array of file names to check
 * @returns Path to the first existing file or null if none found
 */
async function findFirstExistingFile(
	rootDir: string,
	fileNames: readonly string[],
): Promise<string | null> {
	for (const fileName of fileNames) {
		const filePath = join(rootDir, fileName);

		try {
			await access(filePath);
			return filePath;
		} catch {}
	}

	return null;
}
