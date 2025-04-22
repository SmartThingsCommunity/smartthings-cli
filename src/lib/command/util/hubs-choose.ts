import { type Device, DeviceIntegrationType } from '@smartthings/core-sdk'

import { type APICommand } from '../api-command.js'
import { listOwnedHubs } from './hubs.js'
import { type ChooseFunction, createChooseFn } from './util-util.js'


export type ChooseHubFnOptions = {
	locationId?: string | string[]
} | {
	includeOnlyOwnedHubs: true
}
export const chooseHubFn = (options: ChooseHubFnOptions = {}): ChooseFunction<Device> => {
	return createChooseFn(
		{
			itemName: 'hub',
			primaryKeyName: 'deviceId',
			sortKeyName: 'name',
			listTableFieldDefinitions: ['label', 'name', 'deviceId'],
		},
		command =>
			('includeOnlyOwnedHubs' in options)
				? listOwnedHubs(command)
				: command.client.devices.list({ type: DeviceIntegrationType.HUB, locationId: options.locationId }),
		{
			defaultValue: {
				configKey: 'defaultHub',
				getItem: (command: APICommand, id: string): Promise<Device> => command.client.devices.get(id),
				userMessage: (hub: Device): string =>
					`using previously specified default hub labeled "${hub.label}" (${hub.deviceId})`,
			},
		},
	)
}

export const chooseHub = chooseHubFn()
