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
