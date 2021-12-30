import { Flags } from '@oclif/core'

import { APICommand } from '@smartthings/cli-lib'

import { chooseRule, getRuleWithLocation } from '../../lib/commands/rules/rules-util'


export default class RulesDeleteCommand extends APICommand {
	static description = 'delete a rule'

	static flags = {
		...APICommand.flags,
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
		const { args, argv, flags } = await this.parse(RulesDeleteCommand)
		await super.setup(args, argv, flags)

		const ruleId = await chooseRule(this, 'Select a rule to delete.', flags['location-id'], args.id)

		const locationId = flags['location-id']
			?? (await getRuleWithLocation(this.client, ruleId, flags['location-id'])).locationId

		await this.client.rules.delete(ruleId, locationId)
		this.log(`Rule ${ruleId} deleted.`)
	}
}
