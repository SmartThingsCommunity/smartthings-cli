import { type Device, DeviceIntegrationType, type SmartThingsClient } from '@smartthings/core-sdk'

import { type ChooseFunction, createChooseFn } from './util-util.js'


export const chooseHubFn = (options?: { locationId: string | string[] }): ChooseFunction<Device> => {
	return createChooseFn(
		{
			itemName: 'hub',
			primaryKeyName: 'deviceId',
			sortKeyName: 'name',
			listTableFieldDefinitions: ['label', 'name', 'deviceId'],
		},
		(client: SmartThingsClient) =>
			client.devices.list({ type: DeviceIntegrationType.HUB, locationId: options?.locationId }),
	)
}

export const chooseHub = chooseHubFn()
