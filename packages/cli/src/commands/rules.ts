import { Flags } from '@oclif/core'

import { APICommand, outputListing } from '@smartthings/cli-lib'

import { getRulesByLocation, getRuleWithLocation, tableFieldDefinitions } from '../lib/commands/rules/rules-util'


export default class RulesCommand extends APICommand {
	static description = 'get a specific rule'

	static flags = {
		...APICommand.flags,
		...outputListing.flags,
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
		const { args, argv, flags } = await this.parse(RulesCommand)
		await super.setup(args, argv, flags)

		const config = {
			primaryKeyName: 'id',
			sortKeyName: 'name',
			listTableFieldDefinitions: ['name', 'id', 'locationId', 'locationName'],
			tableFieldDefinitions,
		}
		await outputListing(this, config, args.idOrIndex,
			() => getRulesByLocation(this.client, flags['location-id']),
			id => getRuleWithLocation(this.client, id, flags['location-id']),
		)
	}
}
