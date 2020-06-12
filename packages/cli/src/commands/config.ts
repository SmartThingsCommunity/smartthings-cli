import fs from 'fs'
import yaml from 'js-yaml'
import { flags } from '@oclif/command'

import { cliConfig, IOFormat, ListingOutputAPICommand, TableFieldDefinition } from '@smartthings/cli-lib'


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

// TODO: make non-API commands listable as well so we don't have to extend
// APICommand here (or anywhere else we need to do non-API commands that list
// things)
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

	protected listTableFieldDefinitions: TableFieldDefinition<ConfigItem>[] = [
		'name',
		{ label: 'Active', value: (item) => reservedKey(item.name) ? 'N/A' : item.active ? 'true' : '' },
	]

	protected tableFieldDefinitions: TableFieldDefinition<ConfigItem>[] = [
		...this.listTableFieldDefinitions,
		{ label: 'Definition', value: (item) => yaml.safeDump(item.data) },
	]

	protected buildListTableOutput(sortedList: ConfigItem[]): string {
		if (this.flags.verbose) {
			this.listTableFieldDefinitions.push('token')
			if (this.flags.verbose && !!sortedList.find(it => it.data.clientIdProvider?.baseURL)) {
				this.listTableFieldDefinitions.push('apiUrl')
			}
		}

		return super.buildListTableOutput(sortedList)
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(ConfigCommand)
		await super.setup(args, argv, flags)

		const outputOptions = this.outputOptions
		if (!args.name && outputOptions.format === IOFormat.JSON || outputOptions.format === IOFormat.YAML) {
			const data = cliConfig.getRawConfigData()
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
		} else {
			this.processNormally(
				args.name,
				async () => {
					const config = cliConfig.getRawConfigData()
					return Object.keys(config).map(it => {
						return new ConfigItem(it, config[it], this.profileName)
					})
				},
				async (name) => {
					const config = cliConfig.getRawConfigData()
					return new ConfigItem(name, config[name], this.profileName)
				},
			)
		}
	}
}
