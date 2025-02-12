import { type SmartThingsClient, type InstalledApp, InstalledAppListOptions } from '@smartthings/core-sdk'

import { withLocations, type WithNamedLocation } from '../../api-helpers.js'
import { type TableFieldDefinition } from '../../table-generator.js'
import { listTableFieldDefinitions } from './installedapps-table.js'
import { type ChooseFunction, createChooseFn } from './util-util.js'


export type ChooseInstalledAppOptions = {
	verbose?: boolean
	listOptions?: InstalledAppListOptions
}

const buildListTableFieldDefinitions = (
		options?: ChooseInstalledAppOptions,
): TableFieldDefinition<InstalledApp & WithNamedLocation>[] => {
	const retVal: TableFieldDefinition<InstalledApp & WithNamedLocation>[] = [...listTableFieldDefinitions]
	return options?.verbose ? retVal.toSpliced(3, 0, 'location') : retVal
}

const listInstalledAppsFn = (
		options?: ChooseInstalledAppOptions,
) => async (client: SmartThingsClient): Promise<(InstalledApp & WithNamedLocation)[]> => {
	const installedApps = await client.installedApps.list(options?.listOptions)
	if (options?.verbose) {
		return await withLocations(client, installedApps)
	}
	return installedApps
}

export const chooseInstalledAppFn = (
		options?: ChooseInstalledAppOptions,
): ChooseFunction<InstalledApp & WithNamedLocation> => createChooseFn(
	{
		itemName: 'installed app',
		primaryKeyName: 'installedAppId',
		sortKeyName: 'displayName',
		listTableFieldDefinitions: buildListTableFieldDefinitions(options),
	},
	listInstalledAppsFn(options),
)

export const chooseInstalledApp = chooseInstalledAppFn()
