import { flags } from '@oclif/command'
import { CLIError } from '@oclif/errors'

import { LocationItem, Rule, SmartThingsClient } from '@smartthings/core-sdk'

import { APICommand, outputListing, TableFieldDefinition } from '@smartthings/cli-lib'


export const tableFieldDefinitions: TableFieldDefinition<Rule>[] = ['name', 'id',
	{ label: 'Num Actions', value: rule => rule.actions.length.toString() },
	'timeZoneId']

export async function getRulesByLocation(client: SmartThingsClient, locationId?: string): Promise<RuleWithLocation[]> {
	let locations: LocationItem[] = []
	if (locationId) {
		locations = [await client.locations.get(locationId)]
	} else {
		locations = await client.locations.list()
	}

	if (!locations || locations.length == 0) {
		throw Error('could not find any locations for your account. Perhaps ' +
			"you haven't created any locations yet.")
	}

	let rules: RuleWithLocation[] = []
	for (const location of locations) {
		const locationRules = await client.rules.list(location.locationId) ?? []
		rules = rules.concat(locationRules.map(rule => { return { ...rule, locationId: location.locationId, locationName: location.name } }))
	}
	return rules
}

export async function getRule(client: SmartThingsClient, id: string, locationId?: string): Promise<RuleWithLocation> {
	if (locationId) {
		return client.rules.get(id, locationId)
	}
	const allRules = await getRulesByLocation(client, locationId)
	const rule = allRules.find(rule => rule.id === id)
	if (!rule) {
		throw new CLIError(`could not find rule with id ${id}` + locationId ? ` in location ${locationId}` : '')
	}
	return rule
}

export type RuleWithLocation = Rule & {
	locationId?: string
	locationName?: string
}

export default class RulesCommand extends APICommand {
	static description = 'get a specific rule'

	static flags = {
		...APICommand.flags,
		...outputListing.flags,
		'location-id': flags.string({
			char: 'l',
			description: 'a specific location to query',
		}),
	}

	static args = [{
		name: 'idOrIndex',
		description: 'rule UUID or index',
	}]

	primaryKeyName = 'id'
	sortKeyName = 'name'

	listTableFieldDefinitions = ['name', 'id', 'locationId', 'locationName']
	tableFieldDefinitions = tableFieldDefinitions

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(RulesCommand)
		await super.setup(args, argv, flags)

		await outputListing(this, args.idOrIndex,
			() => getRulesByLocation(this.client, flags['location-id']),
			id => getRule(this.client, id, flags['location-id']),
		)
	}
}
