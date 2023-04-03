import { Errors } from '@oclif/core'

import { Mode, SmartThingsClient } from '@smartthings/core-sdk'

import * as modesUtil from './modes-util'
import { APICommand, selectFromList, SelectFromListConfig, TableFieldDefinition, WithNamedLocation } from '@smartthings/cli-lib'
import { chooseLocation } from '../../../commands/locations'


export const tableFieldDefinitions: TableFieldDefinition<Mode>[] = ['label', 'id', 'name' ]
export const tableFieldDefinitionsWithLocationName: TableFieldDefinition<Mode & WithNamedLocation>[] = ['label', 'id', 'name', 'location', 'locationId' ]

export async function getModesByLocation(client: SmartThingsClient, locationId?: string): Promise<(Mode & WithNamedLocation)[]> {
	const locations = locationId ? [await client.locations.get(locationId)] : await client.locations.list()

	if (!locations || locations.length == 0) {
		throw new Errors.CLIError('could not find any locations for your account. Perhaps ' +
			"you haven't created any locations yet.")
	}

	return (await Promise.all(locations.map(async location => {
		const locationModes = await client.modes.list(location.locationId)
		return locationModes.map(mode => ({ ...mode, locationId: location.locationId, location: location.name }) )
	}))).flat()
}

export async function chooseMode(command: APICommand<typeof APICommand.flags>, locationId?: string, preselectedId?: string, autoChoose?: boolean): Promise<[string, string]> {
	// ask user to choose a location, if appropriate, so they aren't mixed together in the modes table
	if (!preselectedId) {
		locationId = await chooseLocation(command, locationId, true)
	}
	const modes = await modesUtil.getModesByLocation(command.client, locationId)

	const config: SelectFromListConfig<Mode & WithNamedLocation> = {
		itemName: 'mode',
		primaryKeyName: 'id',
		sortKeyName: 'label',
		listTableFieldDefinitions: tableFieldDefinitions,
	}
	const modeId = await selectFromList(command, config, {
		preselectedId,
		autoChoose,
		listItems: async () => modes,
	})
	const mode = modes.find(mode => mode.id === modeId)
	if (!mode) {
		throw new Errors.CLIError(`could not find mode with id ${modeId}`)
	}
	if (!mode.locationId) {
		throw new Errors.CLIError(`could not determine location id for mode ${modeId}`)
	}
	return [modeId, mode.locationId]
}
