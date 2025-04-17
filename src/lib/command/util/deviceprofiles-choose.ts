import { type DeviceProfile, type LocaleReference } from '@smartthings/core-sdk'

import { type WithLocales } from '../../api-helpers.js'
import { type TableFieldDefinition } from '../../table-generator.js'
import { type APICommand } from '../api-command.js'
import { type ChooseFunction, createChooseFn } from './util-util.js'


export const chooseDeviceProfileFn = (
		options?: { verbose?: boolean },
): ChooseFunction<DeviceProfile & WithLocales> => {
	const listItems = async (command: APICommand): Promise<(DeviceProfile & WithLocales)[]> => {
		const deviceProfiles = await command.client.deviceProfiles.list()
		if (options?.verbose) {
			return await Promise.all(deviceProfiles.map(async deviceProfile => {
				const withLocales: DeviceProfile & WithLocales = { ...deviceProfile }
				try {
					const locales = await command.client.deviceProfiles.listLocales(deviceProfile.id)
					withLocales.locales = locales?.map((it: LocaleReference) => it.tag).sort().join(', ')
				} catch (error) {
					if (!error.message?.includes('status code 404')) {
						throw error
					}
				}
				return withLocales
			}))
		}
		return deviceProfiles
	}
	const listTableFieldDefinitions: TableFieldDefinition<DeviceProfile & WithLocales>[] = ['name', 'status', 'id']
	if (options?.verbose) {
		listTableFieldDefinitions.splice(3, 0, 'locales')
	}
	return createChooseFn(
		{
			itemName: 'device profile',
			primaryKeyName: 'id',
			sortKeyName: 'name',
			listTableFieldDefinitions,
		},
		listItems,
	)
}

export const chooseDeviceProfile = chooseDeviceProfileFn()
