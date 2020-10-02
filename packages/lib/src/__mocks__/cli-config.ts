export class CLIConfig {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public getProfile(name: string): Record<string, unknown> {
		return {}
	}
}

/* eslint-disable @typescript-eslint/no-explicit-any */
(global as any)._cliConfig = new CLIConfig()

export const cliConfig: CLIConfig = (global as any)._cliConfig
/* eslint-enable @typescript-eslint/no-explicit-any */
