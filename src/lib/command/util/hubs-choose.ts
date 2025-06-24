import { type Device, DeviceIntegrationType } from '@smartthings/core-sdk'

import { type APICommand } from '../api-command.js'
import { listOwnedHubs } from './hubs.js'
import { type ChooseFunction, createChooseFn } from './util-util.js'


export type ChooseHubFnOptions = ({
	locationId?: string | string[]
} | {
	includeOnlyOwnedHubs: true
}) & {
	/**
	 * Limit hubs to those with the specified driver installed.
	 */
	withInstalledDriverId?: string
}
export const chooseHubFn = (options: ChooseHubFnOptions = {}): ChooseFunction<Device> => {
	const listItems = async (command: APICommand): Promise<Device[]> => {
		const unfiltered = ('includeOnlyOwnedHubs' in options)
			? await listOwnedHubs(command)
			: await command.client.devices.list({ type: DeviceIntegrationType.HUB, locationId: options.locationId })
		if (!options.withInstalledDriverId) {
			return unfiltered
		}

		const filtered: Device[] = []
		for (const device of unfiltered) {
			try {
				// This command will throw an error if the driver is not installed on the hub.
				await command.client.hubdevices.getInstalled(device.deviceId, options.withInstalledDriverId)
				filtered.push(device)
			} catch (error) {
				if (!error.message?.includes('not currently installed')) {
					throw error
				}
			}
		}
		return filtered
	}
	const customNotFoundMessage = options.withInstalledDriverId
		? `could not find hub with driver ${options.withInstalledDriverId} installed`
		: undefined
	return createChooseFn(
		{
			itemName: 'hub',
			primaryKeyName: 'deviceId',
			sortKeyName: 'name',
			listTableFieldDefinitions: ['label', 'name', 'deviceId'],
		},
		listItems,
		{
			defaultValue: {
				configKey: 'defaultHub',
				getItem: (command: APICommand, id: string): Promise<Device> => command.client.devices.get(id),
				userMessage: (hub: Device): string =>
					`using previously specified default hub labeled "${hub.label}" (${hub.deviceId})`,
			},
			customNotFoundMessage,
		},
	)
}

export const chooseHub = chooseHubFn()
