import _ from 'lodash'

import { flags } from '@oclif/command'

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

	const isas = _.flatten(await Promise.all(locationIds.map(async (locationId) => {
		try {
			return (await client.schema.installedApps(locationId))
		} catch(e) {
			return []
		}
	})))

	if (verbose) {
		return await withLocations(client, isas)
	}
	return isas
}

export default class InstalledSchemaAppsCommand extends APICommand {
	static description = 'get a specific schema connector instance or a list of instances'

	static flags = {
		...APICommand.flags,
		...outputListing.flags,
		'location-id': flags.string({
			char: 'l',
			description: 'filter results by location',
			multiple: true,
		}),
		verbose: flags.boolean({
			description: 'include location name in output',
			char: 'v',
		}),
	}

	static args = [{
		name: 'id',
		description: 'the isa id',
	}]

	primaryKeyName = 'isaId'
	sortKeyName = 'appName'
	listTableFieldDefinitions = listTableFieldDefinitions
	tableFieldDefinitions = tableFieldDefinitions

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(InstalledSchemaAppsCommand)
		await super.setup(args, argv, flags)

		if (this.flags.verbose) {
			this.listTableFieldDefinitions.splice(3, 0, 'location')
		}

		await outputListing<InstalledSchemaApp, InstalledSchemaAppWithLocation>(this,
			args.id,
			() => installedSchemaInstances(this.client, flags['location-id'], flags.verbose),
			id => this.client.schema.getInstalledApp(id),
		)
	}
}
