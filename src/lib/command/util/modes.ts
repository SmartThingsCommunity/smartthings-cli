import { type Mode, type SmartThingsClient } from '@smartthings/core-sdk'

import { type WithNamedLocation } from '../../api-helpers.js'
import { fatalError } from '../../util.js'


export async function getModesWithLocation(
		client: SmartThingsClient,
		locationId?: string,
): Promise<(Mode & WithNamedLocation)[]> {
	const locations = locationId ? [await client.locations.get(locationId)] : await client.locations.list()

	if (!locations || locations.length == 0) {
		return fatalError('Could not find any locations for your account. Perhaps ' +
			"you haven't created any locations yet.")
	}

	return (await Promise.all(locations.map(async location => {
		const locationModes = await client.modes.list(location.locationId)
		return locationModes.map(mode => ({ ...mode, locationId: location.locationId, location: location.name }) )
	}))).flat()
}
