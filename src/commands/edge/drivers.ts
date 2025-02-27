import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type EdgeDriver } from '@smartthings/core-sdk'

import { type WithOrganization } from '../../lib/api-helpers.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../lib/command/api-organization-command.js'
import {
	allOrganizationsBuilder,
	type AllOrganizationFlags,
} from '../../lib/command/common-flags.js'
import {
	outputItemOrList,
	outputItemOrListBuilder,
	type OutputItemOrListConfig,
	type OutputItemOrListFlags,
} from '../../lib/command/listing-io.js'
import {
	buildTableOutput,
	listDrivers,
	listTableFieldDefinitions,
} from '../../lib/command/util/edge/drivers-util.js'
import { apiDocsURL } from '../../lib/command/api-command.js'


export type CommandArgs = APIOrganizationCommandFlags & AllOrganizationFlags & OutputItemOrListFlags & {
	driverVersion?: string
	idOrIndex?: string
}

const command = 'edge:drivers [id-or-index]'

const describe = 'list all drivers owned by you or retrieve a single driver'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemOrListBuilder(allOrganizationsBuilder(apiOrganizationCommandBuilder(yargs)))
		.positional(
			'id-or-index',
			{ describe: 'the driver id or number from list', type: 'string' },
		)
		.positional('driver-version', { describe: 'driver version', type: 'string' })
		.example([
			['$0 edge:drivers', 'list all edge drivers you own'],
			['$0 edge:drivers 699c7308-8c72-4363-9571-880d0f5cc725', 'display details for a driver by id'],
			[
				'$0 edge:drivers 3',
				'display details for the third driver in the list retrieved by running "smartthings drivers"',
			],
			[
				'$0 edge:drivers 699c7308-8c72-4363-9571-880d0f5cc725 2021-10-25T00:48:23.295969',
				'get information on a specific version of a driver',
			],
		])
		.epilog(
			'Use this command to list all drivers you own, even if they are not yet assigned to' +
			' a channel.\n\n' +
			'See also drivers:installed to list installed drivers and channels:drivers to list' +
			' drivers that are part of a channel you own or have subscribed to.\n\n' +
			apiDocsURL('listDrivers', 'getDriver', 'getDriverRevision'),
		)

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const config: OutputItemOrListConfig<EdgeDriver & WithOrganization> = {
		primaryKeyName: 'driverId',
		sortKeyName: 'name',
		buildTableOutput: (driver: EdgeDriver) => buildTableOutput(command.tableGenerator, driver),
		listTableFieldDefinitions,
	}

	if (argv.allOrganizations) {
		config.listTableFieldDefinitions.push('organization')
	}

	const getDriver = (id: string): Promise<EdgeDriver> =>
		argv.driverVersion
			? command.client.drivers.getRevision(id, argv.driverVersion)
			: command.client.drivers.get(id)

	await outputItemOrList<EdgeDriver & WithOrganization>(command, config, argv.idOrIndex,
		() => listDrivers(command.client, argv.allOrganizations),
		getDriver)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
