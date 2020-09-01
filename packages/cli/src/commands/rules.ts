import { flags } from '@oclif/command'
import { LocationItem, Rule } from '@smartthings/core-sdk'

import { APICommand, ListingOutputAPICommand, TableFieldDefinition } from '@smartthings/cli-lib'


export const tableFieldDefinitions: TableFieldDefinition<Rule>[] = ['name', 'id',
	{ label: 'Num Actions', value: rule => rule.actions.length.toString() },
	'timeZoneId']

export async function getRulesByLocation(this: APICommand, locationId?: string): Promise<RuleWithLocation[]> {
	let locations: LocationItem[] = []
	if (locationId) {
		this.log(`location specified: ${locationId}`)
		locations = [await this.client.locations.get(locationId)]
	} else {
		locations = await this.client.locations.list()
	}

	if (!locations || locations.length == 0) {
		throw Error('could not find any locations for your account. Perhaps ' +
			"you haven't created any locations yet.")
	}

	let rules: RuleWithLocation[] = []
	for (const location of locations) {
		const locationRules = await this.client.rules.list(location.locationId) ?? []
		rules = rules.concat(locationRules.map(rule => { return { ...rule, locationId: location.locationId, locationName: location.name } }))
	}
	return rules
}

export type RuleWithLocation = Rule & {
	locationId?: string
	locationName?: string
}

export default class RulesCommand extends ListingOutputAPICommand<Rule, RuleWithLocation> {
	static description = 'get a specific rule'

	static flags = {
		...ListingOutputAPICommand.flags,
		locationId: flags.string({
			char: 'l',
			description: 'a specific locationId to query',
		}),
	}

	static args = [{
		name: 'idOrIndex',
		description: 'rule UUID or index',
	}]

	primaryKeyName = 'id'
	sortKeyName = 'name'

	protected getRulesByLocation = getRulesByLocation
	protected listTableFieldDefinitions = ['name', 'roomId', 'locationId', 'locationName']
	protected tableFieldDefinitions = tableFieldDefinitions

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(RulesCommand)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.idOrIndex,
			() => { return this.getRulesByLocation(flags.locationId) },
			(id) => { return this.client.rules.get(id, flags.locationId) },
		)
	}
}
