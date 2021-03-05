import { flags } from '@oclif/command'

import { Rule, RuleRequest } from '@smartthings/core-sdk'

import { APICommand, inputAndOutputItem, selectFromList } from '@smartthings/cli-lib'

import { tableFieldDefinitions, getRulesByLocation, getRule } from '../rules'


export default class RulesUpdateCommand extends APICommand {
	static description = 'update a rule'

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
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
		const { args, argv, flags } = this.parse(RulesUpdateCommand)
		await super.setup(args, argv, flags)

		const config = {
			primaryKeyName: 'id',
			sortKeyName: 'name',
			listTableFieldDefinitions: ['name', 'id', 'locationId', 'locationName'],
		}
		const id = await selectFromList(this, config, args.id,
			() => getRulesByLocation(this.client, flags['location-id']))

		await inputAndOutputItem<RuleRequest, Rule>(this, { tableFieldDefinitions },
			async (_, data) => {
				const rule = await getRule(this.client, id, flags['location-id'])
				return this.client.rules.update(id, data, rule.locationId)
			})
	}
}
