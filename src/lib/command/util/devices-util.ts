import {
	type AttributeState,
	type Component,
	type Device,
	type DeviceListOptions,
	type SmartThingsClient,
} from '@smartthings/core-sdk'

import { fatalError } from '../../util.js'
import { type ChooseFunction, createChooseFn } from './util-util.js'


export const chooseDeviceFn = (
		deviceListOptions?: DeviceListOptions,
): ChooseFunction<Device> => createChooseFn(
	{
		itemName: 'device',
		primaryKeyName: 'deviceId',
		sortKeyName: 'label',
		listTableFieldDefinitions: ['label', 'name', 'type', 'deviceId'],
	},
	(client: SmartThingsClient) => client.devices.list(deviceListOptions),
)

export const chooseDevice = chooseDeviceFn()

/**
 * @param device The device for which a component is to be selected
 * @param options
 *     defaultToMain: Set this to false to throw an exception if the device has no components.
 *        The default is to return 'main'.
 */
export const chooseComponentFn = (
		device: Device,
		options?: { defaultToMain: boolean },
): ChooseFunction<Component> => {
	const components = device.components
	const defaultToMain = !options || options.defaultToMain !== false
	if (!components || components.length === 0) {
		// Previously, there were two versions of this function with this behavior being the
		// primary difference.
		if (defaultToMain) {
			return async () => 'main'
		} else {
			return fatalError('No components found')
		}
	}

	return createChooseFn(
		{
			itemName: 'component',
			primaryKeyName: 'id',
			sortKeyName: 'id',
			listTableFieldDefinitions: [
				{
					label: 'Id',
					value: component => component.id === 'main' ? 'main (default)' : component.id,
				},
			],
		},
		async () => components,
	)
}

/**
 * Return a JSON-formatted value for a capability attribute with the unit appended if there is one.
 *
 * Since strings and numbers are valid JSON, if value is a string, this will return a quoted
 * string or just the number for a number.
 */
export const prettyPrintAttribute = (attribute: AttributeState): string => {
	const { unit, value } = attribute
	if (value == null) {
		return ''
	}

	let result = JSON.stringify(value)
	if (result.length > 50) {
		result = JSON.stringify(value, null, 2)
	}

	return `${result}${unit ? ' ' + unit : ''}`
}
