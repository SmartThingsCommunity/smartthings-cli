import { Flags } from '@oclif/core'

import { Rule } from '@smartthings/core-sdk'

import { APICommand, outputItemOrList, OutputItemOrListConfig, WithNamedLocation } from '@smartthings/cli-lib'

import { getRulesByLocation, getRuleWithLocation, tableFieldDefinitions } from '../lib/commands/rules-util'


export default class RulesCommand extends APICommand<typeof RulesCommand.flags> {
	static description = 'get a specific rule' +
		this.apiDocsURL('listRules', 'getRule')

	static flags = {
		...APICommand.flags,
		...outputItemOrList.flags,
		location: Flags.string({
			char: 'l',
			description: 'a specific location to query',
			helpValue: '<UUID>',
		}),
	}

	static args = [{
		name: 'idOrIndex',
		description: 'rule UUID or index',
	}]

	async run(): Promise<void> {
		const config: OutputItemOrListConfig<Rule & WithNamedLocation> = {
			primaryKeyName: 'id',
			sortKeyName: 'name',
			listTableFieldDefinitions: ['name', 'id', 'locationId', 'location'],
			tableFieldDefinitions,
		}
		await outputItemOrList(this, config, this.args.idOrIndex,
			() => getRulesByLocation(this.client, this.flags.location),
			id => getRuleWithLocation(this.client, id, this.flags.location),
		)
	}
}
