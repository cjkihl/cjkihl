import { exec } from "node:child_process";
import node_fs from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import { findRoot } from "@cjkihl/find-root";
import fg from "fast-glob";
import * as semver from "semver";
import type { PackageJson } from "type-fest";

const execAsync = promisify(exec);

export type Package = {
	contents: PackageJson;
	path: string;
};

/**
 * Reads and parses package.json file
 */
export function readPackageJson(pkgPath: string): PackageJson {
	if (!node_fs.existsSync(pkgPath)) {
		throw new Error("No package.json found");
	}
	return JSON.parse(node_fs.readFileSync(pkgPath, "utf8"));
}

async function findWorkspacePackageJsons(
	root: PackageJson,
): Promise<Package[]> {
	// Check if workspaces is an array
	if (!root.workspaces || !Array.isArray(root.workspaces)) {
		throw new Error("Workspaces field must be an array");
	}

	const packages: Package[] = [];

	for (const pattern of root.workspaces) {
		// Glob each workspace pattern to find matching package.jsons
		const paths = await fg(join(pattern, "package.json"));
		for await (const path of paths) {
			const packageJson = readPackageJson(path);
			packages.push({
				contents: packageJson,
				path,
			});
		}
	}
	return packages;
}

/**
 * Get all packages in the workspace
 */
export async function getPackages(): Promise<Package[]> {
	// Find root directory
	const root = await findRoot();
	if (root.packageManager !== "bun") {
		throw new Error("Bump can only be run with bun");
	}

	// Read root package.json
	const rootPkgPath = join(root.root, "package.json");
	const pkgJson = readPackageJson(rootPkgPath);
	return (await findWorkspacePackageJsons(pkgJson)).filter(
		(pkg) => !pkg.contents.private,
	);
}

/**
 * Calculate new version based on current version and release type
 */
export function calculateNewVersion(
	currentVersion: string,
	releaseType: "major" | "minor" | "patch",
): string {
	const newVersion = semver.inc(currentVersion, releaseType);
	if (!newVersion) {
		throw new Error(`Failed to increment version from ${currentVersion}`);
	}
	return newVersion;
}

/**
 * Update version in package.json files
 */
export async function updateVersions(
	packages: Package[],
	newVersion: string,
	dryRun: boolean,
): Promise<void> {
	if (packages.length === 0) {
		throw new Error("No packages to version");
	}

	console.log(`📈 Bumping version to ${newVersion}`);

	if (dryRun) {
		console.log("🔍 Dry run: Would update versions but not writing files");
		return;
	}

	// Update all package.json files
	for (const pkg of packages) {
		const content = node_fs.readFileSync(pkg.path, "utf8");
		// Use regex to replace only the version field while preserving formatting
		const updatedContent = content.replace(
			/"version":\s*"[^"]*"/,
			`"version": "${newVersion}"`,
		);

		node_fs.writeFileSync(pkg.path, updatedContent);

		console.log(`✅ Updated ${pkg.contents.name} to version ${newVersion}`);
	}
}

/**
 * Check if git working directory is clean
 */
export async function checkGitStatus(): Promise<void> {
	try {
		const { stdout } = await execAsync("git status --porcelain");
		if (stdout.trim() !== "") {
			throw new Error(
				"Git working directory is not clean. Please commit or stash your changes.",
			);
		}
	} catch (error) {
		throw new Error(`Failed to check git status: ${error}`);
	}
}

/**
 * Commit and push changes to git
 */
export async function commitAndPush(
	version: string,
	dryRun: boolean,
): Promise<void> {
	if (dryRun) {
		console.log("🔍 Dry run: Would commit and push changes");
		return;
	}

	try {
		console.log("📝 Committing version changes...");
		await execAsync("git add .");
		await execAsync(`git commit -m "chore: release v${version}"`);

		console.log("🚀 Pushing to remote...");
		await execAsync("git push origin main");
	} catch (error) {
		throw new Error(`Failed to commit and push: ${error}`);
	}
}

/**
 * Create git tag
 */
export async function createTag(
	version: string,
	dryRun: boolean,
): Promise<void> {
	if (dryRun) {
		console.log(`🔍 Dry run: Would create tag v${version}`);
		return;
	}

	try {
		console.log(`🏷️  Creating tag v${version}...`);
		await execAsync(`git tag -a v${version} -m "Release v${version}"`);
		await execAsync(`git push origin v${version}`);
	} catch (error) {
		throw new Error(`Failed to create tag: ${error}`);
	}
}

/**
 * Generate release notes for GitHub release
 */
export function generateReleaseNotes(
	version: string,
	packages: Package[],
	releaseType: "major" | "minor" | "patch",
): string {
	const packageNames = packages.map((p) => p.contents.name).join(", ");
	return `## Release v${version}

### Packages Updated
${packages.map((p) => `- ${p.contents.name}@${version}`).join("\n")}

### Changes
This release includes ${releaseType} version updates to ${packageNames}.

---
*This release was created automatically*`;
}

/**
 * Create GitHub release
 */
export async function createGitHubRelease(
	version: string,
	packages: Package[],
	releaseType: "major" | "minor" | "patch",
	dryRun: boolean,
): Promise<void> {
	if (dryRun) {
		console.log(`🔍 Dry run: Would create GitHub release for v${version}`);
		return;
	}

	try {
		// Get the repository info from git remote
		const { stdout: remoteUrl } = await execAsync("git remote get-url origin");

		// Extract repo info (handles both SSH and HTTPS URLs)
		const repoMatch = remoteUrl
			.trim()
			.match(/github\.com[/:](.+?)\/(.+?)(?:\.git)?$/);
		if (!repoMatch) {
			throw new Error("Could not parse GitHub repository from remote URL");
		}

		const [, owner, repo] = repoMatch;
		const releaseBody = generateReleaseNotes(version, packages, releaseType);

		console.log(`🎉 Creating GitHub release v${version}...`);
		await execAsync(
			`gh release create v${version} --title "Release v${version}" --notes "${releaseBody}"`,
		);

		console.log(
			`✅ Created GitHub release: https://github.com/${owner}/${repo}/releases/tag/v${version}`,
		);
	} catch (error) {
		if (
			error instanceof Error &&
			error.message.includes("gh command not found")
		) {
			throw new Error(
				"GitHub CLI (gh) is not installed. Please install it from https://cli.github.com/",
			);
		}
		throw new Error(`Failed to create GitHub release: ${error}`);
	}
}

export interface DeployOptions {
	releaseType: "major" | "minor" | "patch";
	dryRun: boolean;
	skipGit: boolean;
	skipRelease: boolean;
	selectedPackages?: string[];
}

/**
 * Validate package versions are consistent
 */
function validatePackageVersions(packages: Package[]): void {
	if (packages.length === 0) {
		throw new Error("No packages found to validate");
	}

	const firstVersion = packages[0]?.contents.version;
	if (!firstVersion) {
		throw new Error("First package has no version");
	}

	const mismatchedPackages = packages.filter(
		(pkg) => pkg.contents.version !== firstVersion,
	);
	if (mismatchedPackages.length > 0) {
		const packageList = mismatchedPackages
			.map((p) => `${p.contents.name}@${p.contents.version}`)
			.join(", ");
		console.warn(
			`Packages have different versions. Expected ${firstVersion}, found: ${packageList}`,
		);
	}
}

/**
 * Filter packages based on selection
 */
function filterSelectedPackages(
	packages: Package[],
	selectedPackages?: string[],
): Package[] {
	if (!selectedPackages) {
		return packages;
	}

	const filtered = packages.filter(
		(pkg) => pkg.contents.name && selectedPackages.includes(pkg.contents.name),
	);

	// Validate all selected packages exist
	const missingPackages = selectedPackages.filter(
		(name) => !packages.some((p) => p.contents.name === name),
	);
	if (missingPackages.length > 0) {
		throw new Error(
			`Selected packages not found: ${missingPackages.join(", ")}`,
		);
	}

	return filtered;
}

/**
 * Main deployment workflow
 */
export async function deploy(options: DeployOptions): Promise<void> {
	try {
		console.log(
			`🚀 Starting deployment with ${options.releaseType} version bump...`,
		);

		// Get packages to publish
		const allPackages = await getPackages();
		if (allPackages.length === 0) {
			console.log("📝 No packages to deploy");
			return;
		}

		// Filter packages if selection is specified
		const packages = filterSelectedPackages(
			allPackages,
			options.selectedPackages,
		);
		if (packages.length === 0) {
			console.log("📝 No selected packages to deploy");
			return;
		}

		console.log(`📋 Found ${packages.length} package(s) to deploy:`);
		for (const pkg of packages) {
			console.log(`   - ${pkg.contents.name}@${pkg.contents.version}`);
		}

		// Validate package versions
		validatePackageVersions(packages);

		// Check git status
		if (!options.skipGit) {
			await checkGitStatus();
		}

		// Calculate and update versions
		const currentVersion = packages[0]?.contents.version;
		if (!currentVersion) {
			throw new Error("No version found in package.json");
		}

		const newVersion = calculateNewVersion(currentVersion, options.releaseType);
		await updateVersions(packages, newVersion, options.dryRun);

		// Git operations
		if (!options.skipGit) {
			await commitAndPush(newVersion, options.dryRun);
			await createTag(newVersion, options.dryRun);
		}

		// Create GitHub release
		if (!options.skipRelease) {
			await createGitHubRelease(
				newVersion,
				packages,
				options.releaseType,
				options.dryRun,
			);
		}

		console.log(`🎉 Successfully bumped version to v${newVersion}!`);
	} catch (error) {
		console.error("❌ Version bump failed:", error);
		process.exit(1);
	}
}
