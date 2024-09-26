import { type Device, type DeviceListOptions, type SmartThingsClient } from '@smartthings/core-sdk'

import { type ChooseFunction, createChooseFn } from './util-util.js'


export const chooseDeviceFn = (deviceListOptions?: DeviceListOptions): ChooseFunction<Device> => createChooseFn(
	{
		itemName: 'device',
		primaryKeyName: 'deviceId',
		sortKeyName: 'label',
		listTableFieldDefinitions: ['label', 'name', 'type', 'deviceId'],
	},
	(client: SmartThingsClient) => client.devices.list(deviceListOptions),
)

export const chooseDevice = chooseDeviceFn()
