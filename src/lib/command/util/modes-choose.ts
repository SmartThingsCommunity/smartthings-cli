import { type Mode } from '@smartthings/core-sdk'

import { type WithNamedLocation } from '../../api-helpers.js'
import { fatalError } from '../../util.js'
import { type APICommand } from '../api-command.js'
import { selectFromList, type SelectFromListConfig } from '../select.js'
import { chooseLocation } from './locations-util.js'
import { getModesWithLocation } from './modes.js'
import { tableFieldDefinitions } from './modes-table.js'


export const chooseMode = async (
		command: APICommand,
		preselectedId?: string,
		options?: {
			locationId?: string
			autoChoose?: boolean
		},
): Promise<[string, string]> => {
	// Ask user to choose a location, if appropriate, so they aren't mixed together in the modes table.
	// If the user has already specified a mode id, we don't *need* the location. (If given to us,
	// we should still use it so we don't query all locations.)
	const locationId = preselectedId
		? options?.locationId
		: await chooseLocation(command, options?.locationId, { allowIndex: true })
	const modes = await getModesWithLocation(command.client, locationId)

	const config: SelectFromListConfig<Mode & WithNamedLocation> = {
		itemName: 'mode',
		primaryKeyName: 'id',
		sortKeyName: 'label',
		listTableFieldDefinitions: tableFieldDefinitions,
	}
	const modeId = await selectFromList(
		command,
		config,
		{ preselectedId, autoChoose: options?.autoChoose, listItems: async () => modes },
	)
	const mode = modes.find(mode => mode.id === modeId)
	if (!mode) {
		return fatalError(`could not find mode with id ${modeId}`)
	}
	if (!mode.locationId) {
		return fatalError(`could not determine location id for mode ${modeId}`)
	}
	return [modeId, mode.locationId]
}
