import path from "node:path";
import { findUp, findUpSync } from "find-up";

const lockfiles: Record<string, string> = {
	"bun.lock": "bun",
	"bun.lockb": "bun",
	"package-lock.json": "npm",
	"pnpm-lock.yaml": "pnpm",
	"yarn.lock": "yarn",
};

export interface RootResult {
	root: string;
	lockfile: string;
	packageManager: string;
}

function resolveRoot(lockfile: string | undefined): RootResult {
	if (!lockfile) {
		throw new Error(
			`Could not find root directory from ${process.cwd()}. Was looking for one of ${Object.keys(lockfiles).join(", ")}`,
		);
	}
	const root = path.dirname(lockfile);
	const name = path.basename(lockfile);
	const packageManager = lockfiles[name];
	if (!packageManager) {
		throw new Error(
			`Could not detect package manager from lockfile: ${lockfile}`,
		);
	}
	return { lockfile, packageManager, root };
}

/**
 * Finds the root directory of the monorepo by looking for lockfiles
 * @returns {Promise<RootResult>} The root directory info
 * @throws {Error} When no lockfile is found
 * @example
 * const { root, packageManager } = await findRoot();
 */
export async function findRoot(): Promise<RootResult> {
	return resolveRoot(await findUp(Object.keys(lockfiles)));
}

/**
 * Synchronous version of {@link findRoot}. Use in sync-only contexts
 * (e.g. Expo `app.config.js`, which is evaluated via require-from-string).
 * @returns {RootResult} The root directory info
 * @throws {Error} When no lockfile is found
 * @example
 * const { root, packageManager } = findRootSync();
 */
export function findRootSync(): RootResult {
	return resolveRoot(findUpSync(Object.keys(lockfiles)));
}
