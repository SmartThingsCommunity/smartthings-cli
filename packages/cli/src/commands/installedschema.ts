import { Flags } from '@oclif/core'

import { InstalledSchemaApp, SmartThingsClient } from '@smartthings/core-sdk'

import { APICommand, outputListing, TableFieldDefinition, withLocations } from '@smartthings/cli-lib'


export type InstalledSchemaAppWithLocation = InstalledSchemaApp & { location?: string }

export const listTableFieldDefinitions = ['appName', 'partnerName', 'partnerSTConnection', 'isaId']
export const tableFieldDefinitions: TableFieldDefinition<InstalledSchemaApp>[] = [
	'appName', 'isaId', 'partnerName', 'partnerSTConnection', 'locationId',
	'icon', 'icon2x', 'icon3x',
]

export async function installedSchemaInstances(client: SmartThingsClient, locationIds: string[], verbose: boolean): Promise<InstalledSchemaAppWithLocation[]> {
	if (!locationIds) {
		locationIds = (await client.locations.list()).map(it => it.locationId)
	}

	const installedApps = (await Promise.all(locationIds.map(async (locationId) => {
		try {
			return (await client.schema.installedApps(locationId))
		} catch(e) {
			return []
		}
	}))).flat()

	if (verbose) {
		return await withLocations(client, installedApps)
	}
	return installedApps
}

export default class InstalledSchemaAppsCommand extends APICommand<typeof InstalledSchemaAppsCommand.flags> {
	static description = 'get a specific schema connector instance or a list of instances'

	static flags = {
		...APICommand.flags,
		...outputListing.flags,
		// eslint-disable-next-line @typescript-eslint/naming-convention
		'location-id': Flags.string({
			char: 'l',
			description: 'filter results by location',
			multiple: true,
		}),
		verbose: Flags.boolean({
			description: 'include location name in output',
			char: 'v',
		}),
	}

	static args = [{
		name: 'id',
		description: 'the isa id',
	}]

	async run(): Promise<void> {
		const config = {
			primaryKeyName: 'isaId',
			sortKeyName: 'appName',
			listTableFieldDefinitions,
			tableFieldDefinitions,
		}
		if (this.flags.verbose) {
			config.listTableFieldDefinitions.splice(3, 0, 'location')
		}

		await outputListing(this, config, this.args.id,
			() => installedSchemaInstances(this.client, this.flags['location-id'], this.flags.verbose),
			id => this.client.schema.getInstalledApp(id),
		)
	}
}
