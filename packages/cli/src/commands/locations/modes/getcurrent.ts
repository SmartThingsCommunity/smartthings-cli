import { Flags } from '@oclif/core'

import { Mode } from '@smartthings/core-sdk'

import { APICommand, OutputItemOrListConfig, outputItemOrList, WithNamedLocation, formatAndWriteItem, withLocation } from '@smartthings/cli-lib'

import { chooseLocation } from '../../locations'

import { tableFieldDefinitions, tableFieldDefinitionsWithLocationName } from '../../../lib/commands/locations/modes-util'


export default class GetCurrentModeCommand extends APICommand<typeof GetCurrentModeCommand.flags> {
	static description = 'get details of current mode'

	static flags = {
		...APICommand.flags,
		location: Flags.string({
			char: 'l',
			description: 'a specific location to query',
			helpValue: '<UUID>',
		}),
		verbose: Flags.boolean({
			description: 'include location name in output',
			char: 'v',
		}),
		...outputItemOrList.flags,
	}

	static examples = [
		{ description: 'get details of current mode', command: 'smartthings locations:modes:getcurrent' },
		{ description: 'include location name and ID in the output', command: 'smartthings locations:modes:getcurrent --verbose' },
		{ description: 'get the current mode for a specified location', command: 'smartthings locations:modes:getcurrent --location=5dfd6626-ab1d-42da-bb76-90def3153998' },
	]

	async run(): Promise<void> {
		const config: OutputItemOrListConfig<Mode & WithNamedLocation> = {
			primaryKeyName: 'id',
			sortKeyName: 'label',
			listTableFieldDefinitions: tableFieldDefinitions,
			tableFieldDefinitions: tableFieldDefinitions,
		}
		if (this.flags.verbose) {
			config.listTableFieldDefinitions = tableFieldDefinitionsWithLocationName
			config.tableFieldDefinitions = tableFieldDefinitionsWithLocationName
		}
		const locationId = await chooseLocation(this, this.flags.location, true)
		const currentMode = await this.client.modes.getCurrent(locationId)
		const mode = this.flags.verbose ? await withLocation(this.client, { ...currentMode, locationId }) : currentMode
		await formatAndWriteItem(this, config, mode)
	}
}
