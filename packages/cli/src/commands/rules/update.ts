import { Flags } from '@oclif/core'

import { Rule, RuleRequest } from '@smartthings/core-sdk'

import { APICommand, inputAndOutputItem } from '@smartthings/cli-lib'

import { chooseRule, getRuleWithLocation, tableFieldDefinitions } from '../../lib/commands/rules/rules-util'


export default class RulesUpdateCommand extends APICommand {
	static description = 'update a rule'

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
		'location-id': Flags.string({
			char: 'l',
			description: 'a specific location to query',
		}),
	}

	static args = [{
		name: 'id',
		description: 'rule UUID',
	}]

	async run(): Promise<void> {
		const { args, argv, flags } = await this.parse(RulesUpdateCommand)
		await super.setup(args, argv, flags)

		const id = await chooseRule(this, 'Select a rule to update.', flags['location-id'], args.id)

		await inputAndOutputItem<RuleRequest, Rule>(this, { tableFieldDefinitions },
			async (_, data) => {
				const rule = await getRuleWithLocation(this.client, id, flags['location-id'])
				return this.client.rules.update(id, data, rule.locationId)
			})
	}
}
