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
			return {}
		}

		if (this._config == null) {
			// process.stdout.write('reading config file\n')
			this._config = yaml.safeLoad(fs.readFileSync(`${this._configFile}`, 'utf-8'))
			// process.stdout.write(JSON.stringify(this._config, null, 4) + '\n')
		}

		if (!this._config) {
			// empty file; return empty map
			return {}
		}

		if (typeof(this._config) === 'string') {
			throw new Error('invalid config file format; please specify one or more profiles')
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
		if (typeof retVal === 'object') {
			return retVal
		}
		throw new Error(`bad profile configuration for ${name} in ${this._configFile}`)
	}
}

export const cliConfig = new CLIConfig()
