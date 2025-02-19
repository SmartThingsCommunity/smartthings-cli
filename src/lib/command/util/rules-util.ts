import { type LocationItem, type Rule, type SmartThingsClient } from '@smartthings/core-sdk'

import { type WithNamedLocation } from '../../api-helpers.js'
import { fatalError } from '../../util.js'


export const getRulesByLocation = async (
		client: SmartThingsClient,
		locationId?: string,
): Promise<(Rule & WithNamedLocation)[]> => {
	let locations: LocationItem[] = []
	if (locationId) {
		locations = [await client.locations.get(locationId)]
	} else {
		locations = await client.locations.list()
	}

	if (!locations || locations.length == 0) {
		return fatalError('Could not find any locations for your account. Perhaps ' +
			"you haven't created any locations yet.")
	}

	let rules: (Rule & WithNamedLocation)[] = []
	for (const location of locations) {
		const locationRules = await client.rules.list(location.locationId)
		rules = rules.concat(locationRules?.map(rule => ({
			...rule,
			locationId: location.locationId,
			location: location.name,
		})) ?? [])
	}
	return rules
}

export const getRuleWithLocation = async (
		client: SmartThingsClient,
		id: string,
		locationId?: string,
): Promise<Rule & WithNamedLocation> => {
	if (locationId) {
		const location = await client.locations.get(locationId)
		const rule = await client.rules.get(id, locationId)
		return { ...rule, locationId, location: location.name }
	}
	const allRules = await getRulesByLocation(client, locationId)
	const rule = allRules.find(rule => rule.id === id)
	if (!rule) {
		return fatalError(`could not find rule with id ${id} in any location`)
	}
	return rule
}
