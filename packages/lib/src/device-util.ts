import { Device, DeviceListOptions } from '@smartthings/core-sdk'

import { APICommand } from './api-command'
import { ChooseOptions, chooseOptionsDefaults, stringTranslateToId } from './command-util'
import { selectFromList } from './select'


export type DevicePredicate = (value: Device, index: number, array: Device[]) => boolean
export interface ChooseDeviceOptions extends ChooseOptions {
	deviceListOptions?: DeviceListOptions
	deviceListFilter?: DevicePredicate
}
export const chooseDevice = async (command: APICommand, deviceFromArg?: string,
		options?: Partial<ChooseDeviceOptions>): Promise<string> => {
	const opts = { ...chooseOptionsDefaults, ...options }
	const config = {
		itemName: 'device',
		primaryKeyName: 'deviceId',
		sortKeyName: 'label',
		listTableFieldDefinitions: ['label', 'name', 'type', 'deviceId'],
	}
	const deviceListFilter = opts.deviceListFilter ?? (() => true)
	const listItems = async (): Promise<Device[]> =>
		(await command.client.devices.list(opts.deviceListOptions)).filter(deviceListFilter)
	const preselectedId = opts.allowIndex
		? await stringTranslateToId(config, deviceFromArg, listItems)
		: deviceFromArg
	return selectFromList(command, config, { preselectedId, listItems })
}
