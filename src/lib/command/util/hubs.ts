import { type Device, DeviceIntegrationType } from '@smartthings/core-sdk'

import { type APICommand } from '../api-command.js'


/**
 * List hubs owned by the user. Hubs in locations shared with the user are not included because edge
 * drivers cannot be managed on them.
 */
export const listOwnedHubs = async (command: APICommand): Promise<Device[]> => {
	const hubs = await command.client.devices.list({ type: DeviceIntegrationType.HUB })
	const locationIds = new Set<string>()
	hubs.forEach(hub => {
		if (hub.locationId !== undefined) {
			locationIds.add(hub.locationId)
		} else {
			command.logger.warn('hub record found without locationId', hub)
		}
	})

	// remove shared locations
	for (const locationId of locationIds) {
		const location = await command.client.locations.get(locationId, { allowed: true })

		if (!location.allowed?.includes('d:locations')) {
			command.logger.warn('filtering out location', location)
			locationIds.delete(location.locationId)
		}
	}

	return hubs.filter(hub => hub.locationId && locationIds.has(hub.locationId))
}
