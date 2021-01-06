import { flags } from '@oclif/command'

import { Rule, RuleRequest } from '@smartthings/core-sdk'

import { SelectingInputOutputAPICommand } from '@smartthings/cli-lib'

import { tableFieldDefinitions, getRulesByLocation, RuleWithLocation, getRule } from '../rules'


export default class RulesUpdateCommand extends SelectingInputOutputAPICommand<RuleRequest, Rule, RuleWithLocation> {
	static description = 'update a rule'

	static flags = {
		...SelectingInputOutputAPICommand.flags,
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
	protected tableFieldDefinitions = tableFieldDefinitions

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(RulesUpdateCommand)
		await super.setup(args, argv, flags)

		await this.processNormally( args.id,
			() => getRulesByLocation(this.client, flags['location-id']),
			async (id, data) => {
				const rule = await getRule(this.client, id, flags['location-id'])
				return this.client.rules.update(id, data, rule.locationId)
			})
	}
}
