import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type InstalledSchemaApp } from '@smartthings/core-sdk'

import { withLocation, type WithNamedLocation } from '../lib/api-helpers.js'
import { apiCommand, apiCommandBuilder, type APICommandFlags, apiDocsURL } from '../lib/command/api-command.js'
import {
	outputItemOrList,
	outputItemOrListBuilder,
	type OutputItemOrListConfig,
	type OutputItemOrListFlags,
} from '../lib/command/listing-io.js'
import { installedSchemaInstances, listTableFieldDefinitions, tableFieldDefinitions } from '../lib/command/util/installedschema-util.js'


export type CommandArgs =
	& APICommandFlags
	& OutputItemOrListFlags
	& {
		idOrIndex?: string
		location?: string[]
		verbose: boolean
	}

const command = 'installedschema [id-or-index]'

const describe = 'get a specific installed schema app or list installed schema apps'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemOrListBuilder(apiCommandBuilder(yargs))
		.positional(
			'id-or-index',
			{ describe: 'the installed schema app id or number from list', type: 'string' },
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
			['$0 installedschema', 'list all installed schema apps'],
			[
				'$0 installedschema 1',
				'display details for the first installed schema app in the list retrieved by running' +
					' "smartthings installedschema"',
			],
			[
				'$0 installedschema f45c2df1-9dce-4e63-85ba-c7f7fdfe9677',
				'display details for an installed schema app by id',
			],
		])
		.epilog(apiDocsURL('getIsaByLocationId', 'getDevicesByIsaId'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const config: OutputItemOrListConfig<InstalledSchemaApp & WithNamedLocation> = {
		primaryKeyName: 'isaId',
		sortKeyName: 'appName',
		listTableFieldDefinitions,
		tableFieldDefinitions,
	}

	if (argv.verbose) {
		config.listTableFieldDefinitions = listTableFieldDefinitions.toSpliced(3, 0, 'locationId', 'location')
		config.tableFieldDefinitions = tableFieldDefinitions.toSpliced(5, 0, 'location')
	}
	const verboseInstalledApp: (app: Promise<InstalledSchemaApp>) => Promise<InstalledSchemaApp & WithNamedLocation> =
		async app => argv.verbose ? withLocation(command.client, await app) : app

	await outputItemOrList(
		command,
		config,
		argv.idOrIndex,
		() => installedSchemaInstances(command.client, argv.location, { verbose: argv.verbose }),
		id => verboseInstalledApp(command.client.schema.getInstalledApp(id)),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
