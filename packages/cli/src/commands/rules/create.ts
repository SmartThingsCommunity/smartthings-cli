import { Flags } from '@oclif/core'

import { Rule, RuleRequest } from '@smartthings/core-sdk'

import { APICommand, inputAndOutputItem } from '@smartthings/cli-lib'

import { chooseLocation } from '../locations'
import { tableFieldDefinitions } from '../../lib/commands/rules-util'


export default class RulesCreateCommand extends APICommand<typeof RulesCreateCommand.flags> {
	static description = 'create a rule'

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
		'location-id': Flags.string({
			char: 'l',
			description: 'a specific location to query',
		}),
	}

	async run(): Promise<void> {
		const locationId = await chooseLocation(this, this.flags['location-id'])

		await inputAndOutputItem<RuleRequest, Rule>(this, { tableFieldDefinitions },
			(_, rule) => this.client.rules.create(rule, locationId))
	}
}
