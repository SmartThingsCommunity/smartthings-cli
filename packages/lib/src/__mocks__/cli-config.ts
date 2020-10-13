export class CLIConfig {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public getProfile(name: string): Record<string, unknown> {
		return {}
	}
}

(global as { _cliConfig?: CLIConfig })._cliConfig = new CLIConfig()

export const cliConfig: CLIConfig = (global as never as { _cliConfig: CLIConfig })._cliConfig
