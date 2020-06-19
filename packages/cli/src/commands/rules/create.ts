import { flags } from '@oclif/command'
import { Rule, RuleRequest } from '@smartthings/core-sdk'

import { tableFieldDefinitions } from '../rules'
import { InputOutputAPICommand } from '@smartthings/cli-lib'


export default class RulesCreate extends InputOutputAPICommand<RuleRequest, Rule> {
	static description = 'create a rule'

	static flags = {
		...InputOutputAPICommand.flags,
		locationid: flags.string({
			char: 'l',
			description: 'a specific location to query',
		}),
	}

	protected tableFieldDefinitions = tableFieldDefinitions

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(RulesCreate)
		await super.setup(args, argv, flags)

		this.processNormally(rule => {
			return this.client.rules.create(rule, flags.locationid)
		})
	}
}
