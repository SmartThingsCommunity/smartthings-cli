import {
	APICommand,
	selectFromList,
	SelectFromListConfig,
	stringTranslateToId,
} from '@smartthings/cli-lib'

import { Device, DeviceIntegrationType } from '@smartthings/core-sdk'

import { DriverChoice, listDrivers } from './drivers-util'


export const chooseHub = async (command: APICommand<typeof APICommand.flags>,
		promptMessage: string,
		locationId: string,
		commandLineHubId: string | undefined,
		autoChoose?: boolean): Promise<string> => {

	const config: SelectFromListConfig<Device> = {
		itemName: 'hub',
		primaryKeyName: 'deviceId',
		sortKeyName: 'name',
		listTableFieldDefinitions: ['label', 'name', 'deviceId'],
	}

	const listItems = (): Promise<Device[]> => {
		return command.client.devices.list({ type: DeviceIntegrationType.HUB, locationId })
	}

	const preselectedId = await stringTranslateToId(config, commandLineHubId, listItems)

	return selectFromList(command, config,
		{ preselectedId, listItems, promptMessage, autoChoose })
}

export type AllDriverChoice = DriverChoice & { organization: string }

// TODO - consider default org?
export async function chooseDriver(
		command: APICommand<typeof APICommand.flags>,
		promptMessage: string,
		commandLineDriverId?: string): Promise<string> {

	const config: SelectFromListConfig<DriverChoice> = {
		itemName: 'driver',
		primaryKeyName: 'driverId',
		sortKeyName: 'name',
		listTableFieldDefinitions: ['name', 'driverId'],
	}

	const listItems = (): Promise<DriverChoice[]> => listDrivers(command.client, true)

	const preselectedId = await stringTranslateToId(config, commandLineDriverId, listItems)

	return selectFromList(command, config, { preselectedId, listItems, promptMessage })
}
