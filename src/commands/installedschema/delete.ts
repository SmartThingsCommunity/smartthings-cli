import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import type { InstalledSchemaApp } from '@smartthings/core-sdk'

import { type WithNamedLocation } from '../../lib/api-helpers.js'
import { apiCommand, apiCommandBuilder, type APICommandFlags, apiDocsURL } from '../../lib/command/api-command.js'
import { selectFromList, SelectFromListConfig } from '../../lib/command/select.js'
import { installedSchemaInstances } from '../../lib/command/util/installedschema-util.js'


export type CommandArgs =
	& APICommandFlags
	& {
		location?: string[]
		verbose: boolean
		id?: string
	}

export const command = 'installedschema:delete [id]'

const describe = 'delete an installed schema app'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiCommandBuilder(yargs)
		.positional('id', { describe: 'installed schema app id', type: 'string' })
		.option('location', {
			alias: 'l',
			describe: 'filter results by location',
			type: 'string',
			array: true,
		})
		.option('verbose',
			{ alias: 'v', describe: 'include location name in output', type: 'boolean', default: false })
		.example([
			['$0 installedschema:delete', 'choose the installed schema app to delete from a list'],
			[
				'$0 installedschema:delete 5dfd6626-ab1d-42da-bb76-90def3153998',
				'delete the installed schema app with the specified id',
			],
		])
		.epilog(apiDocsURL('deleteIsaByIsaId'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const config: SelectFromListConfig<InstalledSchemaApp & WithNamedLocation> = {
		primaryKeyName: 'isaId',
		sortKeyName: 'appName',
		listTableFieldDefinitions: ['appName', 'partnerName', 'partnerSTConnection', 'isaId'],
	}
	if (argv.verbose) {
		config.listTableFieldDefinitions.splice(3, 0, 'location')
	}

	const id = await selectFromList(command, config, {
		preselectedId: argv.id,
		listItems: () => installedSchemaInstances(command.client, argv.location, { verbose: argv.verbose }),
		promptMessage: 'Select an installed schema app to delete.',
	})
	await command.client.schema.deleteInstalledApp(id)
	console.log(`Installed schema app ${id} deleted.`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
