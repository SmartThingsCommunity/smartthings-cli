import { Flags } from '@oclif/core'

import { APICommand, outputListing } from '@smartthings/cli-lib'

import { getRulesByLocation, getRuleWithLocation, tableFieldDefinitions } from '../lib/commands/rules-util'


export default class RulesCommand extends APICommand<typeof RulesCommand.flags> {
	static description = 'get a specific rule'

	static flags = {
		...APICommand.flags,
		...outputListing.flags,
		// eslint-disable-next-line @typescript-eslint/naming-convention
		'location-id': Flags.string({
			char: 'l',
			description: 'a specific location to query',
		}),
	}

	static args = [{
		name: 'idOrIndex',
		description: 'rule UUID or index',
	}]

	async run(): Promise<void> {
		const config = {
			primaryKeyName: 'id',
			sortKeyName: 'name',
			listTableFieldDefinitions: ['name', 'id', 'locationId', 'locationName'],
			tableFieldDefinitions,
		}
		await outputListing(this, config, this.args.idOrIndex,
			() => getRulesByLocation(this.client, this.flags['location-id']),
			id => getRuleWithLocation(this.client, id, this.flags['location-id']),
		)
	}
}
