import { Flags } from '@oclif/core'

import { Mode } from '@smartthings/core-sdk'

import { APICommand, OutputItemOrListConfig, outputItemOrList, WithNamedLocation } from '@smartthings/cli-lib'

import { getModesByLocation, tableFieldDefinitions, tableFieldDefinitionsWithLocationName } from '../../lib/commands/locations/modes-util'


export default class ModeCommand extends APICommand<typeof ModeCommand.flags> {
	static description = 'list modes or get information for a specific mode'

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

	static args = [{
		name: 'idOrIndex',
		description: 'mode UUID or index',
	}]

	static examples = [
		{ description: 'list all modes in your location(s)', command: 'smartthings locations:modes' },
		{ description: 'get details of the third mode in the list retrieved by running "smartthings locations:modes"', command: 'smartthings locations:modes 3' },
		{ description: 'get details of a mode by its id', command: 'smartthings locations:modes 636169e4-8b9f-4438-a941-953b0d617231' },
		{ description: 'include location name and ID in the output', command: 'smartthings locations:modes --verbose' },
		{ description: 'list all modes in a particular location', command: 'smartthings locations:modes --location=5dfd6626-ab1d-42da-bb76-90def3153998' },
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
		const modes = await getModesByLocation(this.client, this.flags.location)
		await outputItemOrList(this, config, this.args.idOrIndex,
			async () => modes,
			async id => {
				const mode = modes.find(mode => mode.id === id)
				if (!mode) {
					throw Error(`could not find mode with id ${id}`)
				}
				if (this.flags.verbose) {
					return mode
				}
				// If we aren't using `verbose` flag, get the raw mode again
				// so there aren't extra fields in JSON/YAML output
				return this.client.modes.get(id, mode.locationId)
			})
	}
}
