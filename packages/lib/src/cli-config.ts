import fs from 'fs'

import yaml from 'js-yaml'


export class CLIConfig {
	private _configFile: string|null = null
	private _config: object|null = null

	public init(configFile: string): void {
		this._configFile = configFile
	}

	public get configFile(): string|null {
		return this._configFile
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public loadConfig(): { [name: string]: any } {
		if (this._configFile == null) {
			throw new Error('config not yet initialized')
		}

		if (!fs.existsSync(this._configFile)) {
			this._config = {}
		}

		if (this._config == null) {
			const parsed = yaml.safeLoad(fs.readFileSync(`${this._configFile}`, 'utf-8'))
			if (parsed) {
				if (typeof parsed === 'object') {
					this._config = parsed
				} else {
					throw new Error('invalid config file format; please specify zero or more profiles')
				}
			}
		}

		if (!this._config) {
			// empty file; use empty map
			this._config = {}
		}

		return this._config
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public getRawConfigData(): { [name: string]: any } {
		if (!this._config) {
			throw new Error('config not initialized completely')
		}
		return this._config
	}

	public getProfile(name: string): object {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const config: { [name: string]: any } = this.loadConfig()
		if (!(name in config)) {
			return {}
		}
		const retVal = config[name]
		if (retVal === null) {
			throw new Error('null profile specified. Check config.yaml for errors.')
		}
		if (typeof retVal === 'object') {
			return retVal
		}
		throw new Error(`bad profile configuration for ${name} in ${this._configFile}`)
	}
}

/* eslint-disable @typescript-eslint/no-explicit-any */
if (!('_cliConfig' in (global as any))) {
	(global as any)._cliConfig = new CLIConfig()
}

export const cliConfig = (global as any)._cliConfig
/* eslint-enable @typescript-eslint/no-explicit-any */
