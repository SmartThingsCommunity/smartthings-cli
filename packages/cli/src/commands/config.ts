import path from 'path'
import yaml from 'js-yaml'
import {APICommand, ListingOutputAPICommand, CLIConfig, IOFormat} from '@smartthings/cli-lib'
import { flags } from '@oclif/command'
import fs from 'fs'


function reservedKey(key: string): boolean {
	return key === 'logging'
}

export interface ConfigData {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[name: string]: any
}

export class ConfigItem {
	public name: string
	public active: string
	token: string
	apiUrl?: string
	data: ConfigData

	constructor(key: string, data: ConfigData, profileName: string) {
		this.name = key
		this.active = reservedKey(key) ? 'N/A' : key === profileName ? 'true' : ''
		this.token = data.token || ''
		this.apiUrl = data.clientIdProvider?.baseURL || ''
		this.data = data
	}

}

export default class ConfigCommand extends ListingOutputAPICommand<ConfigItem, ConfigItem> {
	static description = 'list config file entries'

	static flags = {
		...ListingOutputAPICommand.flags,
		verbose: flags.boolean({
			description: 'Include additional data in table output',
			char: 'v',
		}),
	}

	static args = [{
		name: 'name',
		description: 'the config name',
	}]

	primaryKeyName = 'name'
	sortKeyName = 'name'

	protected buildObjectTableOutput(this: APICommand, item: ConfigItem): string {
		const table = this.newOutputTable()
		table.push(['Name', item.name])
		table.push(['Active', reservedKey(item.name) ? 'N/A' : !!item.active])
		table.push(['Definition', yaml.safeDump(item.data)])
		return table.toString()
	}

	protected buildTableOutput(sortedList: ConfigItem[]): string {
		const head = this.flags.verbose ? ['#', 'name', 'active', 'token'] : ['#', 'name', 'active']
		if (this.flags.verbose && !!sortedList.find(it => it.data.clientIdProvider?.baseURL)) {
			head.push('apiUrl')
		}
		const table = this.newOutputTable({head})
		let count = 1
		for (const item of sortedList) {
			// @ts-ignore
			table.push([count++, ...head.slice(1).map(it => item[it])])
		}
		return table.toString()
	}

	private getCliConfig(): ConfigData {
		const cliConfig = new CLIConfig()
		cliConfig.init(path.join(this.config.configDir, 'config.yaml'))
		return cliConfig.loadConfig()
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(ConfigCommand)
		await super.setup(args, argv, flags)

		const outputOptions = this.outputOptions
		if (!args.name && outputOptions.format === IOFormat.JSON || outputOptions.format === IOFormat.YAML) {
			const data = this.getCliConfig()
			const output = outputOptions.format === IOFormat.JSON ?
				JSON.stringify(data, null, outputOptions.indentLevel) :
				yaml.safeDump(data, { indent: outputOptions.indentLevel })

			if (this.outputOptions.filename) {
				fs.writeFileSync(this.outputOptions.filename, output)
			} else {
				process.stdout.write(output)
				if (!output.endsWith('\n')) {
					process.stdout.write('\n')
				}
			}
		}
		else {
			this.processNormally(
				args.name,
				async () => {
					const config = this.getCliConfig()
					return Object.keys(config).map(it => {
						return new ConfigItem(it, config[it], this.profileName)
					})
				},
				async (name) => {
					const config = this.getCliConfig()
					return new ConfigItem(name, config[name], this.profileName)
				},
			)
		}
	}
}
