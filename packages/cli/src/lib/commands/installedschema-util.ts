import { InstalledSchemaApp, SmartThingsClient } from '@smartthings/core-sdk'

import { TableFieldDefinition, withLocations, WithNamedLocation } from '@smartthings/cli-lib'


export const listTableFieldDefinitions = ['appName', 'partnerName', 'partnerSTConnection', 'isaId']
export const tableFieldDefinitions: TableFieldDefinition<InstalledSchemaApp>[] = [
	'appName', 'isaId', 'partnerName', 'partnerSTConnection', 'locationId',
	'icon', 'icon2x', 'icon3x',
]

export const installedSchemaInstances = async (client: SmartThingsClient, locationIds: string[] | undefined, verbose: boolean): Promise<(InstalledSchemaApp & WithNamedLocation)[]> => {
	// We accept and handle undefined locationIds because that's what we get from oclif even
	// though the type is just `string[]`.
	if (!locationIds || locationIds.length == 0) {
		locationIds = (await client.locations.list()).map(it => it.locationId)
	}

	const installedApps = (await Promise.all(locationIds.map(locationId => client.schema.installedApps(locationId)))).flat()

	return verbose ? await withLocations(client, installedApps) : installedApps
}
