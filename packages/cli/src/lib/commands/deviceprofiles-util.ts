import {
	DeviceProfile,
	DeviceProfileCreateRequest,
	DeviceProfileUpdateRequest,
	LocaleReference,
} from '@smartthings/core-sdk'

import {
	APIOrganizationCommand,
	ChooseOptions,
	chooseOptionsWithDefaults,
	selectFromList,
	SelectFromListConfig,
	stringTranslateToId,
	WithLocales,
} from '@smartthings/cli-lib'


export const chooseDeviceProfile = async (command: APIOrganizationCommand<typeof APIOrganizationCommand.flags>,
		deviceProfileFromArg?: string, options?: Partial<ChooseOptions<DeviceProfile & WithLocales>>): Promise<string> => {
	const opts = chooseOptionsWithDefaults(options)
	const config: SelectFromListConfig<DeviceProfile & WithLocales> = {
		itemName: 'device profile',
		primaryKeyName: 'id',
		sortKeyName: 'name',
		listTableFieldDefinitions: ['name', 'status', 'id'],
	}
	if (opts.verbose) {
		config.listTableFieldDefinitions.splice(3, 0, 'locales')
	}

	const listItems = async (): Promise<(DeviceProfile & WithLocales)[]> => {
		const deviceProfiles = await command.client.deviceProfiles.list()
		if (opts.verbose) {
			const ops = deviceProfiles.map(async it => {
				try {
					return await command.client.deviceProfiles.listLocales(it.id)
				} catch (error) {
					if ('message' in error && error.message.includes('status code 404')) {
						return []
					} else {
						throw error
					}
				}
			})

			const locales = await Promise.all(ops)

			return deviceProfiles.map((deviceProfile, index) => {
				return { ...deviceProfile, locales: locales[index].map((it: LocaleReference) => it.tag).sort().join(', ') }
			})
		}
		return deviceProfiles
	}

	const preselectedId = opts.allowIndex
		? await stringTranslateToId(config, deviceProfileFromArg, listItems)
		: deviceProfileFromArg
	return selectFromList(command, config, { preselectedId, listItems })
}

/**
 * Convert the `DeviceProfile` to a `DeviceProfileCreateRequest` by removing fields which can't
 * be included in an create request.
 */
export const cleanupForCreate = (deviceProfile: Partial<DeviceProfile & { restrictions: unknown }>): DeviceProfileCreateRequest => {
	const components = deviceProfile.components?.map(component => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { label, ...withoutLabel } = component
		return withoutLabel
	})
	const createRequest = { ...deviceProfile, components }
	delete createRequest.id
	delete createRequest.status
	delete createRequest.restrictions
	return createRequest
}

/**
 * Convert the `DeviceProfile` to a `DeviceProfileUpdateRequest` by removing fields which can't
 * be included in an update request.
 */
export const cleanupForUpdate = (deviceProfile: Partial<DeviceProfile & { restrictions: unknown }>): DeviceProfileUpdateRequest => {
	const updateRequest = cleanupForCreate(deviceProfile)
	delete updateRequest.name
	return updateRequest
}
