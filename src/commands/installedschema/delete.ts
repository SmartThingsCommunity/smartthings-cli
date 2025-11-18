import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import type { InstalledSchemaApp } from '@smartthings/core-sdk'

import { type WithNamedLocation } from '../../lib/api-helpers.js'
import { buildEpilog } from '../../lib/help.js'
import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../../lib/command/api-command.js'
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

const describe = 'delete an installed Schema App'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiCommandBuilder(yargs)
		.positional('id', { describe: 'installed Schema App id', type: 'string' })
		.option('location', {
			alias: 'l',
			describe: 'filter results by location',
			type: 'string',
			array: true,
		})
		.option('verbose',
			{ alias: 'v', describe: 'include location name in output', type: 'boolean', default: false })
		.example([
			['$0 installedschema:delete', 'choose the installed Schema App to delete from a list'],
			[
				'$0 installedschema:delete 5dfd6626-ab1d-42da-bb76-90def3153998',
				'delete the installed Schema App with the specified id',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'deleteIsaByIsaId' }))

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
		promptMessage: 'Select an installed Schema App to delete.',
	})
	await command.client.schema.deleteInstalledApp(id)
	console.log(`Installed Schema App ${id} deleted.`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
