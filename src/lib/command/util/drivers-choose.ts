import {
	type DriverChannelDetailsWithName,
	type DriverChoice,
	listAssignedDriversWithNames,
	listDrivers,
} from './edge-drivers.js'
import { type ChooseFunction, createChooseFn } from './util-util.js'


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

export const chooseDriverFromChannelFn = (channelId: string): ChooseFunction<DriverChannelDetailsWithName> =>
	createChooseFn(
		{
			itemName: 'driver',
			primaryKeyName: 'driverId',
			sortKeyName: 'name',
		},
		command => listAssignedDriversWithNames(command.client, channelId),
	)
