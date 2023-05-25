import { Flags } from '@oclif/core'

import { Rule, RuleRequest } from '@smartthings/core-sdk'

import { APICommand, inputAndOutputItem } from '@smartthings/cli-lib'

import { chooseLocation } from '../locations.js'
import { tableFieldDefinitions } from '../../lib/commands/rules-util.js'


export default class RulesCreateCommand extends APICommand<typeof RulesCreateCommand.flags> {
	static description = 'create a rule' +
		this.apiDocsURL('createRule')

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
		location: Flags.string({
			char: 'l',
			description: 'the location for the rule',
			helpValue: '<UUID>',
		}),
	}

	async run(): Promise<void> {
		const locationId = await chooseLocation(this, this.flags.location)

		await inputAndOutputItem<RuleRequest, Rule>(this, { tableFieldDefinitions },
			(_, rule) => this.client.rules.create(rule, locationId))
	}
}
