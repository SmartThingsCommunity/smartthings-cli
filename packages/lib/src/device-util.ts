import { Component, Device, DeviceListOptions } from '@smartthings/core-sdk'

import { APICommand } from './api-command'
import { ChooseOptions, chooseOptionsDefaults, stringTranslateToId } from './command-util'
import { selectFromList, SelectingConfig } from './select'
import { SmartThingsCommandInterface } from './smartthings-command'


export type DevicePredicate = (value: Device, index: number, array: Device[]) => boolean
export interface ChooseDeviceOptions extends ChooseOptions {
	deviceListOptions?: DeviceListOptions
	deviceListFilter?: DevicePredicate
}
export const chooseDevice = async (command: APICommand<typeof APICommand.flags>, deviceFromArg?: string,
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

export const chooseComponent = async (command: SmartThingsCommandInterface, componentFromArg?: string, components?: Component[]): Promise<string> => {
	if (!components || components.length === 0) {
		return 'main'
	}

	const config: SelectingConfig<Component> = {
		itemName: 'component',
		primaryKeyName: 'id',
		sortKeyName: 'id',
		listTableFieldDefinitions: [{ label: 'Id', value: component => component.id === 'main' ? 'main (default)' : component.id }],
	}
	const listItems = async (): Promise<Component[]> => components
	const preselectedId = await stringTranslateToId(config, componentFromArg, listItems)
	return selectFromList(command, config, { preselectedId, listItems, autoChoose: true })
}
