import { flags } from '@oclif/command'

import { Rule, RuleRequest } from '@smartthings/core-sdk'

import { InputOutputAPICommand } from '@smartthings/cli-lib'

import { tableFieldDefinitions } from '../rules'


export default class RulesCreate extends InputOutputAPICommand<RuleRequest, Rule> {
	static description = 'create a rule'

	static flags = {
		...InputOutputAPICommand.flags,
		'location-id': flags.string({
			char: 'l',
			description: 'a specific location to query',
			required: true, // TODO: ask user if not specified instead of making this required
		}),
	}

	protected tableFieldDefinitions = tableFieldDefinitions

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(RulesCreate)
		await super.setup(args, argv, flags)

		this.processNormally(rule => {
			return this.client.rules.create(rule, flags['location-id'])
		})
	}
}
