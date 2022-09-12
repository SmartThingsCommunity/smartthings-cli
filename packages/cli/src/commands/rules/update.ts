import { Flags } from '@oclif/core'

import { Rule, RuleRequest } from '@smartthings/core-sdk'

import { APICommand, inputAndOutputItem } from '@smartthings/cli-lib'

import { chooseRule, getRuleWithLocation, tableFieldDefinitions } from '../../lib/commands/rules-util'


export default class RulesUpdateCommand extends APICommand<typeof RulesUpdateCommand.flags> {
	static description = 'update a rule'

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
		location: Flags.string({
			char: 'l',
			description: 'a specific location to query',
		}),
	}

	static args = [{
		name: 'id',
		description: 'rule UUID',
	}]

	async run(): Promise<void> {
		const id = await chooseRule(this, 'Select a rule to update.', this.flags.location, this.args.id)

		await inputAndOutputItem<RuleRequest, Rule>(this, { tableFieldDefinitions },
			async (_, data) => {
				const rule = await getRuleWithLocation(this.client, id, this.flags.location)
				return this.client.rules.update(id, data, rule.locationId)
			})
	}
}
