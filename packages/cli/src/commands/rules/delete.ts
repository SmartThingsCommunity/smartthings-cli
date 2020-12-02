import { flags } from '@oclif/command'
import { Rule } from '@smartthings/core-sdk'

import { getRulesByLocation } from '../rules'
import { SelectingAPICommand } from '@smartthings/cli-lib'


export default class RulesDeleteCommand extends SelectingAPICommand<Rule> {
	static description = 'delete a rule'

	static flags = {
		...SelectingAPICommand.flags,
		locationId: flags.string({
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

	protected getRulesByLocation = getRulesByLocation
	protected listTableFieldDefinitions = ['name', 'id', 'locationId', 'locationName']

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(RulesDeleteCommand)
		await super.setup(args, argv, flags)

		const rulesPromise = this.getRulesByLocation(flags.locationId)
		await this.processNormally(
			args.id,
			() => rulesPromise,
			async id => {
				const rule = (await rulesPromise).find(RuleWithLocation => RuleWithLocation.id === id)
				if (!rule) {
					throw Error(flags.locationId ? `could not find rule with id ${id} in room ${flags.locationId}` : `could not find rule with id ${id}`)
				}
				await this.client.rules.delete(id, rule.locationId)
			},
			'rule {{id}} deleted')
	}
}
