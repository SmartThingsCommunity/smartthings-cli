import { flags } from '@oclif/command'

import { Rule, RuleRequest } from '@smartthings/core-sdk'

import { APICommand, inputAndOutputItem } from '@smartthings/cli-lib'

import { chooseLocation } from '../locations'
import { tableFieldDefinitions } from '../rules'


export default class RulesCreateCommand extends APICommand {
	static description = 'create a rule'

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
		'location-id': flags.string({
			char: 'l',
			description: 'a specific location to query',
		}),
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(RulesCreateCommand)
		await super.setup(args, argv, flags)

		const locationId = await chooseLocation(this, flags['location-id'])

		await inputAndOutputItem<RuleRequest, Rule>(this, { tableFieldDefinitions },
			(_, rule) => this.client.rules.create(rule, locationId))
	}
}
