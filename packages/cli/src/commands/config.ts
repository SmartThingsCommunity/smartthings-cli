import yaml from 'js-yaml'
import { flags } from '@oclif/command'

import { buildOutputFormatter, calculateOutputFormat, cliConfig, IOFormat, outputItem, outputList, outputListing,
	SmartThingsCommand, stringTranslateToId, TableFieldDefinition, writeOutput } from '@smartthings/cli-lib'


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

	listTableFieldDefinitions: TableFieldDefinition<ConfigItem>[] = [
		'name',
		{ label: 'Active', value: (item) => reservedKey(item.name) ? 'N/A' : item.active ? 'true' : '' },
	]

	tableFieldDefinitions: TableFieldDefinition<ConfigItem>[] = [
		...this.listTableFieldDefinitions,
		{ label: 'Definition', value: (item) => yaml.safeDump(item.data) },
	]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(ConfigCommand)
		await super.setup(args, argv, flags)

		if (this.flags.verbose) {
			this.listTableFieldDefinitions.push('token')
		}

		const getConfig = async (name: string): Promise<ConfigItem> => {
			const config = cliConfig.getRawConfigData()
			return new ConfigItem(name, config[name], this.profileName)
		}
		const listConfigs = async (): Promise<ConfigItem[]> => {
			const config = cliConfig.getRawConfigData()
			const list = Object.keys(config).map(it => {
				return new ConfigItem(it, config[it], this.profileName)
			})
			if (this.flags.verbose && !!list.find(it => it.data?.clientIdProvider?.baseURL)) {
				this.listTableFieldDefinitions.push('apiUrl')
			}
			return list
		}

		if (args.name) {
			const id = await stringTranslateToId(this, args.name, listConfigs)
			await outputItem(this, () => getConfig(id))
		} else {
			const outputFormat = calculateOutputFormat(this)
			if (outputFormat === IOFormat.COMMON) {
				await outputList(this, listConfigs, true)
			} else {
				const outputFormatter = buildOutputFormatter(this)
				await writeOutput(outputFormatter(cliConfig.getRawConfigData()), this.flags.output)
			}
		}
	}
}
