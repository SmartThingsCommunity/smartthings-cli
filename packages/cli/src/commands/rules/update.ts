import { flags } from '@oclif/command'
import { Rule, RuleRequest } from '@smartthings/core-sdk'

import { tableFieldDefinitions, getRulesByLocation, RuleWithLocation } from '../rules'
import { SelectingInputOutputAPICommand } from '@smartthings/cli-lib'


export default class RulesUpdateCommand extends SelectingInputOutputAPICommand <RuleRequest, Rule, RuleWithLocation> {
	static description = 'update a rule'

	static flags = {
		...SelectingInputOutputAPICommand.flags,
		locationId: flags.string({
			char: 'l',
			description: 'a specific locationId to query',
		}),
	}

	static args = [{
		name: 'id',
		description: 'rule UUID',
	}]

	primaryKeyName = 'id'
	sortKeyName = 'name'

	protected getRulesByLocation = getRulesByLocation
	protected listTableFieldDefinitions = ['name', 'id', 'locationId', 'locationName']
	protected tableFieldDefinitions = tableFieldDefinitions

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(RulesUpdateCommand)
		await super.setup(args, argv, flags)

		const rulesPromise = this.getRulesByLocation(flags.locationId)
		await this.processNormally(
			args.id,
			() => rulesPromise,
			async (id, data) => {
				const rule = (await rulesPromise).find(RuleWithLocation => RuleWithLocation.id === id)
				if (!rule) {
					throw Error(flags.locationId ? `could not find rule with id ${id} in room ${flags.locationId}` : `could not find rule with id ${id}`)
				}
				return this.client.rules.update(id, data, rule.locationId)},
		)
	}
}
