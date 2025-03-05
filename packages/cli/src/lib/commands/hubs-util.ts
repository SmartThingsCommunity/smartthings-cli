import {
	APICommand,
	selectFromList,
	SelectFromListConfig,
	stringTranslateToId,
} from '@smartthings/cli-lib'
import { Device, DeviceIntegrationType } from '@smartthings/core-sdk'
import { DriverChoice, listDrivers } from '@smartthings/plugin-cli-edge/lib/lib/commands/drivers-util'


export type AllDriverChoice = DriverChoice & { organization: string }

// TODO: When moving this to yargs, deal with duplicate version in drivers-util module.
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
