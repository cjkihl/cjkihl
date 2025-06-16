import { publish } from "./index.pub";

// Get the package path from command line arguments or use current directory
const packagePath = process.argv[2] || process.cwd();

// Run publish
publish(packagePath).catch((error) => {
	console.error("❌ Publish failed:", error);
	process.exit(1);
});
