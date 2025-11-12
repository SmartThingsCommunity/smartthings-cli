import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type InstalledApp, type InstalledAppListOptions } from '@smartthings/core-sdk'

import { withLocation, withLocations, type WithNamedLocation } from '../lib/api-helpers.js'
import { buildEpilog } from '../lib/help.js'
import {
	apiCommand,
	apiCommandBuilder,
	type APICommandFlags,
} from '../lib/command/api-command.js'
import {
	outputItemOrList,
	outputItemOrListBuilder,
	type OutputItemOrListConfig,
	type OutputItemOrListFlags,
} from '../lib/command/listing-io.js'
import {
	listTableFieldDefinitions,
	tableFieldDefinitions,
} from '../lib/command/util/installedapps-table.js'


export type CommandArgs = APICommandFlags & OutputItemOrListFlags & {
	idOrIndex?: string
	location?: string[] | string
	verbose: boolean
}

const command = 'installedapps [id-or-index]'

const describe = 'get a specific installed app or a list of installed apps'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemOrListBuilder(apiCommandBuilder(yargs))
		.positional(
			'id-or-index',
			{ describe: 'the installed app name or number from list', type: 'string' },
		)
		.option(
			'location',
			{ alias: 'l', describe: 'filter results by location', type: 'string', array: true },
		)
		.option(
			'verbose',
			{
				alias: 'v',
				describe: 'include location name in output',
				type: 'boolean',
				default: false,
			},
		)
		.example([
			['$0 installedapps', 'list all installed apps'],
			[
				'$0 installedapps 1',
				'display details for the first installed app in the list retrieved by running' +
					' "smartthings installedapps"',
			],
			[
				'$0 installedapps f45c2df1-9dce-4e63-85ba-c7f7fdfe9677',
				'display details for an installed app by id',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: ['listInstallations', 'getInstallation'] }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const config: OutputItemOrListConfig<InstalledApp & WithNamedLocation> = {
		primaryKeyName: 'installedAppId',
		sortKeyName: 'displayName',
		listTableFieldDefinitions,
		tableFieldDefinitions,
	}

	if (argv.verbose) {
		config.listTableFieldDefinitions.splice(3, 0, 'locationId', 'location')
		config.tableFieldDefinitions.splice(7, 0, 'location')
	}
	const verboseInstalledApp: (app: Promise<InstalledApp>) => Promise<InstalledApp & WithNamedLocation> =
		argv.verbose ? async app => withLocation(command.client, await app) : app => app

	const installedApps = async (): Promise<(InstalledApp & WithNamedLocation)[]> => {
		const listOptions: InstalledAppListOptions = {
			locationId: argv.location,
		}
		const apps = await command.client.installedApps.list(listOptions)
		if (argv.verbose) {
			return await withLocations(command.client, apps)
		}
		return apps
	}

	await outputItemOrList(
		command,
		config,
		argv.idOrIndex,
		installedApps,
		id => verboseInstalledApp(command.client.installedApps.get(id)),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
