import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import {
	type Device,
	DeviceIntegrationType,
	type DeviceListOptions,
} from '@smartthings/core-sdk'

import { withLocationsAndRooms, type WithNamedRoom } from '../lib/api-helpers.js'
import { buildEpilog } from '../lib/help.js'
import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../lib/command/api-command.js'
import {
	outputItemOrList,
	outputItemOrListBuilder,
	type OutputItemOrListConfig,
	type OutputItemOrListFlags,
} from '../lib/command/listing-io.js'
import { buildTableOutput } from '../lib/command/util/devices-table.js'


export type CommandArgs = APICommandFlags & OutputItemOrListFlags & {
	idOrIndex?: string
	location?: string[] | string
	installedApp?: string
	verbose: boolean
}

const command = 'virtualdevices [id-or-index]'

const describe = 'list all virtual devices available in a user account or retrieve a single device'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemOrListBuilder(apiCommandBuilder(yargs))
		.positional(
			'id-or-index',
			{ describe: 'the device id or number from list', type: 'string' },
		)
		.option(
			'location',
			{ alias: 'l', describe: 'filter results by location', type: 'string', array: true },
		)
		.option(
			'installed-app',
			{
				alias: 'a',
				describe: 'filter results by installed app that created the device',
				type: 'string',
			},
		)
		.option(
			'verbose',
			{
				alias: 'v',
				describe: 'include location and room name in output',
				type: 'boolean',
				default: false,
			},
		)
		.example([
			['$0 virtualdevices', 'list all virtualdevices'],
			[
				'$0 virtualdevices 1',
				'display details for the first virtual device in the list retrieved by running ' +
					'"smartthings virtualdevices"',
			],
			[
				'$0 virtualdevices 5dfd6626-ab1d-42da-bb76-90def3153998',
				'display details for a virtual device by id',
			],
			[
				'$0 virtualdevices --location c822dcee-bb9f-41b8-915b-6406e5676845',
				'list all virtual devices in the specified location',
			],
		])
		.epilog(buildEpilog({ command }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const config: OutputItemOrListConfig<Device & WithNamedRoom> = {
		primaryKeyName: 'deviceId',
		sortKeyName: 'label',
		listTableFieldDefinitions: ['label', 'deviceId'],
		buildTableOutput: (data: Device) => buildTableOutput(command.tableGenerator, data),
	}
	if (argv.verbose) {
		config.listTableFieldDefinitions.splice(3, 0, 'location', 'room')
	}

	const deviceListOptions: DeviceListOptions = {
		locationId: argv.location,
		installedAppId: argv.installedApp,
		type: DeviceIntegrationType.VIRTUAL,
	}

	await outputItemOrList<Device & WithNamedRoom>(
		command,
		config,
		argv.idOrIndex,
		async () => {
			const devices = await command.client.devices.list(deviceListOptions)
			if (argv.verbose) {
				return await withLocationsAndRooms(command.client, devices)
			}
			return devices
		},
		id => command.client.devices.get(id),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
