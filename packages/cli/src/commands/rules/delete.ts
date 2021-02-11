import { flags } from '@oclif/command'

import { APICommand, selectFromList } from '@smartthings/cli-lib'

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

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(RulesDeleteCommand)
		await super.setup(args, argv, flags)

		const config = {
			primaryKeyName: 'id',
			sortKeyName: 'name',
			listTableFieldDefinitions: ['name', 'id', 'locationId', 'locationName'],
		}
		const id = await selectFromList(this, config, args.id,
			() => getRulesByLocation(this.client, flags['location-id']),
			'Select a rule to delete.')
		const locationIdForRule = async (): Promise<string | undefined> => {
			const rule = await getRule(this.client, id, flags['location-id'])
			return rule.locationId
		}
		const locationId = flags['location-id'] ?? await locationIdForRule()
		await this.client.rules.delete(id, locationId)
		this.log(`Rule ${id} deleted.`)
	}
}
