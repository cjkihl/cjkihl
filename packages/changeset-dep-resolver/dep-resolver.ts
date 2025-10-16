// scripts/resolve-workspace-deps.ts

import { exec } from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { promisify } from "node:util";
import assembleReleasePlan from "@changesets/assemble-release-plan";
import { read as readConfig } from "@changesets/config";
import { readPreState } from "@changesets/pre";
import readChangesets from "@changesets/read";
import { getPackages } from "@manypkg/get-packages";

interface PackageInfo {
	name: string;
	version: string;
	publishedVersions: string[];
}

const execAsync = promisify(exec);

async function getNpmPackageInfo(
	packageName: string,
): Promise<PackageInfo | null> {
	try {
		const { stdout } = await execAsync(`npm info ${packageName} --json`);
		const info = JSON.parse(stdout);
		return {
			name: packageName,
			publishedVersions: info.versions || [],
			version: info.version,
		};
	} catch (_error) {
		// Package doesn't exist on npm
		return null;
	}
}

async function resolveWorkspaceDependencies(cwd: string = process.cwd()) {
	console.log("🔍 Resolving workspace dependencies...");

	// Get all packages in the monorepo
	const packagesResult = await getPackages(cwd);

	// Read changesets and config
	const [changesets, preState, config] = await Promise.all([
		readChangesets(cwd),
		readPreState(cwd),
		readConfig(cwd),
	]);

	// Assemble release plan to know which packages are being released
	const releasePlan = assembleReleasePlan(
		changesets,
		packagesResult as any,
		config,
		preState,
	);

	// Create a map of packages being released with their new versions
	const releasingPackages = new Map<string, string>();
	for (const release of releasePlan.releases) {
		releasingPackages.set(release.name, release.newVersion);
	}

	// Create a map of all local packages
	const localPackages = new Map<string, string>();
	for (const pkg of packagesResult.packages) {
		localPackages.set(pkg.packageJson.name, pkg.packageJson.version);
	}

	// Track changes for backup
	const originalFiles = new Map<string, string>();
	const modifiedPackages = new Set<string>();

	// Process each package
	for (const pkg of packagesResult.packages) {
		const { packageJson, dir } = pkg;
		const packagePath = path.join(dir, "package.json");

		let hasChanges = false;
		const dependencyTypes = [
			"dependencies",
			"devDependencies",
			"peerDependencies",
			"optionalDependencies",
		] as const;

		for (const depType of dependencyTypes) {
			const deps = packageJson[depType];
			if (!deps) continue;

			for (const [depName, depVersion] of Object.entries(deps)) {
				if (
					typeof depVersion === "string" &&
					depVersion.startsWith("workspace:")
				) {
					const workspaceRange = depVersion.replace(/^workspace:/, "");

					// Determine the resolved version
					let resolvedVersion: string;

					if (releasingPackages.has(depName)) {
						// Use the new version from the release plan
						resolvedVersion = releasingPackages.get(depName)!;
						console.log(
							`📦 ${packageJson.name}: ${depName}@${depVersion} → ${resolvedVersion} (from release plan)`,
						);
					} else if (localPackages.has(depName)) {
						// Use the current local version
						resolvedVersion = localPackages.get(depName)!;
						console.log(
							`📦 ${packageJson.name}: ${depName}@${depVersion} → ${resolvedVersion} (local package)`,
						);
					} else {
						// Try to get the latest version from npm
						const npmInfo = await getNpmPackageInfo(depName);
						if (npmInfo) {
							resolvedVersion = npmInfo.version;
							console.log(
								`📦 ${packageJson.name}: ${depName}@${depVersion} → ${resolvedVersion} (from npm)`,
							);
						} else {
							console.warn(
								`⚠️  ${packageJson.name}: Could not resolve ${depName}@${depVersion} - keeping as is`,
							);
							continue;
						}
					}

					// Determine the appropriate range type
					let newRange: string;
					if (workspaceRange === "*") {
						// Use exact version for workspace:*
						newRange = resolvedVersion;
					} else if (workspaceRange === "^" || workspaceRange === "~") {
						// Preserve the range type
						newRange = `${workspaceRange}${resolvedVersion}`;
					} else {
						// For specific versions like workspace:1.0.0, use the range type
						newRange = `^${resolvedVersion}`;
					}

					// Update the dependency
					deps[depName] = newRange;
					hasChanges = true;
				}
			}
		}

		if (hasChanges) {
			// Backup original file
			if (!originalFiles.has(packagePath)) {
				originalFiles.set(packagePath, await fs.readFile(packagePath, "utf-8"));
			}

			// Write updated package.json
			await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2));
			modifiedPackages.add(packageJson.name);
		}
	}

	if (modifiedPackages.size > 0) {
		console.log(
			`\n✅ Resolved workspace dependencies in ${modifiedPackages.size} packages:`,
		);
		for (const pkgName of modifiedPackages) {
			console.log(`   - ${pkgName}`);
		}

		// Create a backup file
		const backupPath = path.join(cwd, ".workspace-deps-backup.json");
		await fs.writeFile(
			backupPath,
			JSON.stringify(
				{
					modifiedPackages: Array.from(modifiedPackages),
					originalFiles: Object.fromEntries(originalFiles),
					timestamp: new Date().toISOString(),
				},
				null,
				2,
			),
		);

		console.log(`\n💾 Backup created at: ${backupPath}`);
		console.log("🚀 Ready to publish! Run 'changeset publish' now.");

		return {
			backupPath,
			modifiedPackages: Array.from(modifiedPackages),
		};
	}
	console.log("✅ No workspace dependencies to resolve.");
	return { backupPath: null, modifiedPackages: [] };
}

async function restoreWorkspaceDependencies(cwd: string = process.cwd()) {
	const backupPath = path.join(cwd, ".workspace-deps-backup.json");

	try {
		await fs.access(backupPath);
	} catch {
		console.log("❌ No backup file found to restore.");
		return;
	}

	try {
		const backupContent = await fs.readFile(backupPath, "utf-8");
		const backup = JSON.parse(backupContent);

		console.log("🔄 Restoring workspace dependencies...");

		for (const [filePath, originalContent] of Object.entries(
			backup.originalFiles,
		)) {
			await fs.writeFile(filePath, originalContent as string);
			console.log(`   - Restored: ${path.relative(cwd, filePath)}`);
		}

		await fs.unlink(backupPath);
		console.log("✅ Workspace dependencies restored successfully.");
	} catch (error) {
		console.error("❌ Failed to restore workspace dependencies:", error);
	}
}

export { resolveWorkspaceDependencies, restoreWorkspaceDependencies };
