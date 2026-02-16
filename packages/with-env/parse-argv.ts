/**
 * Parsed result from parseArgv (internal type).
 */
interface ParseArgvResult {
	command: string;
	args: string[];
	envFile?: string[];
}

/**
 * Parses argv (typically process.argv.slice(2)) into command, args, and optional --env-file.
 * Supports -- to separate with-env options from the command.
 *
 * @param argv - Arguments (e.g. from process.argv.slice(2))
 * @returns Parsed command, args, and optional envFile paths
 * @throws If no command is provided (empty rest after parsing)
 */
export function parseArgv(argv: string[]): ParseArgvResult {
	const envFiles: string[] = [];
	const rest: string[] = [];
	let i = 0;

	while (i < argv.length) {
		const arg = argv[i]!;
		if (arg === "--") {
			rest.push(...argv.slice(i + 1));
			break;
		}
		if (arg === "--env-file") {
			const next = argv[i + 1];
			if (next === undefined || next.startsWith("-")) {
				console.error("error: --env-file requires a path");
				process.exit(1);
			}
			envFiles.push(next);
			i += 2;
			continue;
		}
		rest.push(arg);
		i += 1;
	}

	if (rest.length === 0) {
		console.error(
			"usage: with-env [--env-file <file>] [--] <command> [args...]",
		);
		process.exit(1);
	}

	const command = rest[0] as string;
	const args = rest.slice(1);

	return {
		args,
		command,
		...(envFiles.length > 0 && { envFile: envFiles }),
	};
}
