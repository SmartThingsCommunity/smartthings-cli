import yaml from 'js-yaml'
import { Flags } from '@oclif/core'

import { buildOutputFormatter, calculateOutputFormat, IOFormat, outputItem, outputList,
	outputListing, SmartThingsCommand, stringTranslateToId, TableFieldDefinition,
	writeOutput } from '@smartthings/cli-lib'


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
		this.token = data?.token ?? ''
		this.apiUrl = data?.clientIdProvider?.baseURL ?? ''
		this.data = data
	}
}

export default class ConfigCommand extends SmartThingsCommand {
	static description = 'list config file entries'

	static flags = {
		...SmartThingsCommand.flags,
		...outputListing.flags,
		verbose: Flags.boolean({
			description: 'Include additional data in table output',
			char: 'v',
		}),
	}

	static args = [{
		name: 'name',
		description: 'the config name',
	}]

	async run(): Promise<void> {
		const { args, argv, flags } = await this.parse(ConfigCommand)
		await super.setup(args, argv, flags)

		const listTableFieldDefinitions: TableFieldDefinition<ConfigItem>[] = [
			'name',
			{ label: 'Active', value: (item) => reservedKey(item.name) ? 'N/A' : item.active ? 'true' : '' },
		]
		const tableFieldDefinitions: TableFieldDefinition<ConfigItem>[] = [
			...listTableFieldDefinitions,
			{ label: 'Definition', value: (item) => yaml.dump(item.data) },
		]

		const outputListConfig = {
			primaryKeyName: 'name',
			sortKeyName: 'name',
			listTableFieldDefinitions,
		}
		if (this.flags.verbose) {
			outputListConfig.listTableFieldDefinitions.push('token')
		}

		const getConfig = async (name: string): Promise<ConfigItem> => {
			const config = this.cliConfig.mergedProfiles
			return new ConfigItem(name, config[name], this.profileName)
		}
		const listConfigs = async (): Promise<ConfigItem[]> => {
			const config = this.cliConfig.mergedProfiles
			const list = Object.keys(config).map(it => {
				return new ConfigItem(it, config[it], this.profileName)
			})
			if (this.flags.verbose && !!list.find(it => it.data?.clientIdProvider?.baseURL)) {
				listTableFieldDefinitions.push('apiUrl')
			}
			return list
		}

		if (args.name) {
			const id = await stringTranslateToId(outputListConfig, args.name, listConfigs)
			await outputItem(this, { tableFieldDefinitions }, () => getConfig(id))
		} else {
			const outputFormat = calculateOutputFormat(this)
			if (outputFormat === IOFormat.COMMON) {
				await outputList(this, outputListConfig, listConfigs, true)
			} else {
				const outputFormatter = buildOutputFormatter(this)
				await writeOutput(outputFormatter(this.cliConfig.mergedProfiles), this.flags.output)
			}
		}
	}
}
