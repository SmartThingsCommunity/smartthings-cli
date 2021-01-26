import { flags } from '@oclif/command'

import { APICommand, selectAndActOn } from '@smartthings/cli-lib'

import { getRule, getRulesByLocation } from '../rules'


export default class RulesDeleteCommand extends APICommand {
	static description = 'delete a rule'

	static flags = {
		...APICommand.flags,
		'location-id': flags.string({
			char: 'l',
			description: 'a specific location to query',
		}),
	}

	static args = [{
		name: 'id',
		description: 'rule UUID',
	}]

	primaryKeyName = 'id'
	sortKeyName = 'name'

	protected listTableFieldDefinitions = ['name', 'id', 'locationId', 'locationName']

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(RulesDeleteCommand)
		await super.setup(args, argv, flags)

		await selectAndActOn(this,
			args.id,
			() => getRulesByLocation(this.client, flags['location-id']),
			async id => {
				const rule = await getRule(this.client, id, flags['location-id'])
				await this.client.rules.delete(id, rule.locationId)
			},
			'rule {{id}} deleted')
	}
}
