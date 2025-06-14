import { Command } from "commander";
import { checkbox, Separator } from "@inquirer/prompts";
import { deploy, type DeployOptions, getPackages, calculateNewVersion, type Package } from "./index.pub";

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
  .option("--packages <packages>", "Comma-separated list of package names to bump (e.g., @org/pkg1,@org/pkg2)")
  .addHelpText("after", `
Examples:
  bump --major
  bump --minor
  bump --patch
  bump --dry-run
  bump --skip-git
  bump --skip-release
  bump --packages @org/pkg1,@org/pkg2
`);

program.parse();

const options = program.opts();

// Validate that only one version bump type is specified
const bumpTypes = [options.major, options.minor, options.patch].filter(Boolean);
if (bumpTypes.length > 1) {
  console.error("❌ Error: Only one version bump type (--major, --minor, or --patch) can be specified");
  process.exit(1);
}

const releaseType = options.major ? "major" : options.minor ? "minor" : "patch";

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

  // Calculate new version for display
  const currentVersion = packages[0]?.contents.version;
  if (!currentVersion) {
    throw new Error("No version found in package.json");
  }
  const newVersion = calculateNewVersion(currentVersion, releaseType);

  // Create choices for inquirer
  const choices = [
    { name: "Select All", value: "all", checked: true },
    new Separator(),
    ...packages.map((pkg: Package) => ({
      name: `${pkg.contents.name} (${pkg.contents.version} → ${newVersion})`,
      value: pkg.contents.name,
      checked: true
    }))
  ];

  const selectedPackages = await checkbox({
    message: "Select packages to bump:",
    choices,
    validate: (choices) => choices.length > 0 ? true : "Please select at least one package"
  });

  // Handle "Select All" option
  if (selectedPackages.includes("all")) {
    return packages.map((p: Package) => p.contents.name);
  }

  return selectedPackages;
}

// Run the main function
async function main() {
  try {
    const selectedPackages = await selectPackages();
    
    const deployOptions: DeployOptions = {
      releaseType,
      dryRun: options.dryRun ?? false,
      skipGit: options.skipGit ?? false,
      skipRelease: options.skipRelease ?? false,
      selectedPackages
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