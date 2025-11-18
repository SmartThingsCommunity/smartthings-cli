import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type EdgeDriver } from '@smartthings/core-sdk'

import { buildEpilog } from '../../../lib/help.js'
import { fatalError } from '../../../lib/util.js'
import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../../../lib/command/api-command.js'
import {
	outputItemOrList,
	outputItemOrListBuilder,
	type OutputItemOrListConfig,
	type OutputItemOrListFlags,
} from '../../../lib/command/listing-io.js'
import { buildTableOutput, listTableFieldDefinitions } from '../../../lib/command/util/edge-drivers.js'


export type CommandArgs =
	& APICommandFlags
	& OutputItemOrListFlags
	& {
		idOrIndex?: string
	}

const command = 'edge:drivers:default [id-or-index]'

const describe = 'list default drivers available to all users'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemOrListBuilder(apiCommandBuilder(yargs))
		.positional('id-or-index', { describe: 'driver id or number in list', type: 'string' })
		.example([
			['$0 edge:drivers:default', 'list default drivers'],
			[
				'$0 edge:drivers:default 12',
				'display details for the twelfth driver in the list retrieved by running' +
					' "smartthings edge:drivers:default"',
			],
			[
				'$0 edge:drivers:default 5dfd6626-ab1d-42da-bb76-90def3153998',
				'display details for a default driver by id',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'getDefaultDrivers' }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const config: OutputItemOrListConfig<EdgeDriver> = {
		primaryKeyName: 'driverId',
		sortKeyName: 'name',
		buildTableOutput: (driver: EdgeDriver) => buildTableOutput(command.tableGenerator, driver),
		listTableFieldDefinitions,
	}

	await outputItemOrList(
		command,
		config,
		argv.idOrIndex,
		() => command.client.drivers.listDefault(),
		async (id) => {
			const list = await command.client.drivers.listDefault()
			const driver = list.find(it => it.driverId === id)
			if (!driver) {
				return fatalError(`Could not find driver with id ${id}.`)
			}
			return driver
		},
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
