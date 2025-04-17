import { type EdgeDriverSummary } from '@smartthings/core-sdk'

import { type ChooseFunction, createChooseFn } from './util-util.js'
import { listDrivers } from './edge/drivers-util.js'


/**
 * When presenting a list of drivers to choose from, we only use the `driverId` and `name` fields.
 * Using this type instead of `EdgeDriverSummary` allows the caller of `chooseDriver` (below)
 * to use functions that return other objects as long as they include these two fields.
 */
export type DriverChoice = Pick<EdgeDriverSummary, 'driverId' | 'name'>

export const chooseDriverFn = (
		options?: { includeAllOrganizations: boolean },
): ChooseFunction<DriverChoice> => createChooseFn<DriverChoice>(
	{
		itemName: 'driver',
		primaryKeyName: 'driverId',
		sortKeyName: 'name',
	},
	command => listDrivers(command.client, options?.includeAllOrganizations),
)

export const chooseDriver = chooseDriverFn()
