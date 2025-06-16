import { Separator, checkbox, select } from "@inquirer/prompts";
import { Command } from "commander";
import {
	type DeployOptions,
	type Package,
	calculateNewVersion,
	deploy,
	getPackages,
} from "./index.pub";

const program = new Command();

program
	.name("bump")
	.description("🚀 Bump - Custom version bump tool")
	.version("1.0.0")
	.option("--major", "Bump major version (1.0.0 -> 2.0.0)")
	.option("--minor", "Bump minor version (1.0.0 -> 1.1.0)")
	.option("--patch", "Bump patch version (1.0.0 -> 1.0.1) [default]")
	.option("--dry-run", "Show what would be done without making changes")
	.option("--skip-git", "Skip git operations (commit, push, tag)")
	.option("--skip-release", "Skip GitHub release creation")
	.option(
		"--packages <packages>",
		"Comma-separated list of package names to bump (e.g., @org/pkg1,@org/pkg2)",
	)
	.addHelpText(
		"after",
		`
Examples:
  bump --major
  bump --minor
  bump --patch
  bump --dry-run
  bump --skip-git
  bump --skip-release
  bump --packages @org/pkg1,@org/pkg2
`,
	);

program.parse();

const options = program.opts();

// Validate that only one version bump type is specified
const bumpTypes = [options.major, options.minor, options.patch].filter(Boolean);
if (bumpTypes.length > 1) {
	console.error(
		"❌ Error: Only one version bump type (--major, --minor, or --patch) can be specified",
	);
	process.exit(1);
}

async function selectPackages() {
	// If packages are specified via CLI, use those
	if (options.packages) {
		return options.packages.split(",").map((p: string) => p.trim());
	}

	// Get all packages
	const packages = await getPackages();
	if (packages.length === 0) {
		console.log("📝 No packages found to bump");
		process.exit(0);
	}

	// Create choices for inquirer
	const choices = [
		{ name: "Select All", value: "all", checked: true },
		new Separator(),
		...packages.map((pkg: Package) => ({
			name: `${pkg.contents.name} (${pkg.contents.version})`,
			value: pkg.contents.name,
			checked: true,
		})),
	];

	const selectedPackages = await checkbox({
		message: "Select packages to bump:",
		choices,
		validate: (choices) =>
			choices.length > 0 ? true : "Please select at least one package",
	});

	// Handle "Select All" option
	if (selectedPackages.includes("all")) {
		return packages.map((p: Package) => p.contents.name);
	}

	return selectedPackages;
}

async function selectVersion(
	packages: Package[],
	selectedPackageNames: string[],
) {
	// Find the highest version among selected packages
	const selectedPackages = packages.filter(
		(p) => p.contents.name && selectedPackageNames.includes(p.contents.name),
	);
	const highestVersion = selectedPackages.reduce((highest, pkg) => {
		const version = pkg.contents.version || "0.0.0";
		return version > highest ? version : highest;
	}, "0.0.0");

	// Calculate possible new versions
	const patchVersion = calculateNewVersion(highestVersion, "patch");
	const minorVersion = calculateNewVersion(highestVersion, "minor");
	const majorVersion = calculateNewVersion(highestVersion, "major");

	const choices = [
		{
			name: `Patch (${highestVersion} → ${patchVersion})`,
			value: "patch" as const,
			description: "For backwards-compatible bug fixes",
		},
		{
			name: `Minor (${highestVersion} → ${minorVersion})`,
			value: "minor" as const,
			description: "For new backwards-compatible functionality",
		},
		{
			name: `Major (${highestVersion} → ${majorVersion})`,
			value: "major" as const,
			description: "For breaking changes",
		},
	];

	const selectedVersion = await select({
		message: "Select version bump type:",
		choices,
	});

	return selectedVersion;
}

// Run the main function
async function main() {
	try {
		const packages = await getPackages();
		const selectedPackageNames = await selectPackages();
		const releaseType = await selectVersion(packages, selectedPackageNames);

		const deployOptions: DeployOptions = {
			releaseType,
			dryRun: options.dryRun ?? false,
			skipGitCheck: options.skipGitCheck ?? true,
			skipTag: options.skipTag ?? false,
			skipRelease: options.skipRelease ?? false,
			selectedPackages: selectedPackageNames,
		};

		await deploy(deployOptions);
	} catch (error) {
		console.error("❌ Deploy failed:", error);
		process.exit(1);
	}
}

// Handle errors gracefully
process.on("unhandledRejection", (error) => {
	console.error("❌ Unhandled rejection:", error);
	process.exit(1);
});

main();
