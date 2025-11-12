import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import {
	type Device,
	DeviceIntegrationType,
	type DeviceGetOptions,
	type DeviceListOptions,
	type DeviceStatus,
} from '@smartthings/core-sdk'

import { withLocationAndRoom, withLocationsAndRooms, type WithNamedRoom } from '../lib/api-helpers.js'
import { buildEpilog } from '../lib/help.js'
import { type TableFieldDefinition } from '../lib/table-generator.js'
import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../lib/command/api-command.js'
import {
	outputItemOrList,
	outputItemOrListBuilder,
	type OutputItemOrListConfig,
	type OutputItemOrListFlags,
} from '../lib/command/listing-io.js'
import { buildTableOutput } from '../lib/command/util/devices-table.js'


export type CommandArgs =
	& APICommandFlags
	& OutputItemOrListFlags
	& {
		location?: string[]
		capability?: string[]
		capabilitiesMode?: 'and' | 'or'
		device?: string[]
		installedApp?: string
		status: boolean
		health: boolean
		type?: DeviceIntegrationType[]
		verbose: boolean
		idOrIndex?: string
	}

const command = 'devices [id-or-index]'

const describe = 'get a list of devices or details of a specific device'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemOrListBuilder(apiCommandBuilder(yargs))
		.positional('id-or-index', { describe: 'the device id or number from list', type: 'string' })
		.option('location', {
			alias: 'l',
			describe: 'filter results by location',
			type: 'string',
			array: true,
		})
		.option('capability', {
			alias: 'c',
			describe: 'filter results by capability',
			type: 'string',
			array: true,
		})
		.option('capabilities-mode', {
			alias: 'C',
			choices: ['and', 'or'],
			describe: 'logical operator for multiple capability filter options',
			default: 'and',
		})
		.option('device', {
			alias: 'd',
			describe: 'filter results by device',
			type: 'string',
			array: true,
		})
		.option('installed-app', {
			alias: 'a',
			describe: 'filter results by installed app that created the device',
			type: 'string',
		})
		.option('status', {
			alias: 's',
			describe: 'include attribute values in the response',
			type: 'boolean',
			default: false,
		})
		.option('health', {
			alias: 'H',
			describe: 'include device health in the response',
			type: 'boolean',
			default: false,
		})
		.option('type', {
			describe: 'filter results by device integration type',
			type: 'string',
			array: true,
			choices: Object.values(DeviceIntegrationType),
			coerce: arg => arg?.map((str: string) => str.toUpperCase() as DeviceIntegrationType),
		})
		.option('verbose',
			{ alias: 'v', describe: 'include location and room name in output', type: 'boolean', default: false })
		.example([
			['$0 devices', 'list all devices'],
			[
				'$0 devices 1',
				'display details for the first device in the list retrieved by running "smartthings devices"',
			],
			['$0 devices 5dfd6626-ab1d-42da-bb76-90def3153998', 'display details for a device by id'],
			['$0 devices --capability switch', 'list devices with the switch capability'],
			[
				'$0 devices --capability button --capability temperatureMeasurement',
				'list devices with both the button and temperatureMeasurement capabilities',
			],
			[
				'$0 devices --capability button --capability temperatureMeasurement --capabilitiesMode or',
				'list devices with either the button or temperatureMeasurement capability',
			],
			['$0 devices --verbose', 'include location and room names in the output'],
			['$0 devices --type zigbee --type zwave', 'list Zigbee and Z-Wave devices'],
		])
		.epilog(buildEpilog({ command, apiDocs: ['getDevices', 'getDevice'] }))

// type that includes extra fields sometimes included when requested via command line flags
export type OutputDevice = Device & WithNamedRoom & Pick<DeviceStatus, 'healthState'>

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const listTableFieldDefinitions: TableFieldDefinition<OutputDevice>[] = ['label', 'name', 'type', 'deviceId']

	if (argv.verbose) {
		listTableFieldDefinitions.splice(3, 0, 'location', 'room')
	}

	if (argv.health) {
		listTableFieldDefinitions.splice(3, 0, {
			path: 'healthState.state',
			label: 'Health',
		})
	}

	const config: OutputItemOrListConfig<OutputDevice> = {
		primaryKeyName: 'deviceId',
		sortKeyName: 'label',
		listTableFieldDefinitions,
		buildTableOutput: (data: Device) => buildTableOutput(command.tableGenerator, data),
	}

	const deviceGetOptions: DeviceGetOptions = {
		includeStatus: argv.status,
	}

	const deviceListOptions: DeviceListOptions = {
		capability: argv.capability,
		capabilitiesMode: argv.capabilitiesMode === 'or' ? 'or' : 'and',
		locationId: argv.location,
		deviceId: argv.device,
		installedAppId: argv.installedApp,
		type: argv.type as DeviceIntegrationType[] | undefined,
		includeHealth: argv.health,
		...deviceGetOptions,
	}

	await outputItemOrList<OutputDevice>(command, config, argv.idOrIndex,
		async () => {
			const devices = await command.client.devices.list(deviceListOptions)
			if (argv.verbose) {
				return await withLocationsAndRooms(command.client, devices)
			}
			return devices
		},
		async id => {
			let chosenDevice: OutputDevice = await command.client.devices.get(id, deviceGetOptions)
			if (argv.verbose) {
				chosenDevice = await withLocationAndRoom(command.client, chosenDevice)
			}
			// Note -- we have to do this explicitly because the API does not honor the includeHealth
			// parameter for individual devices
			if (argv.health) {
				const healthState = await command.client.devices.getHealth(id)
				chosenDevice = { ...chosenDevice, healthState }
			}
			return chosenDevice
		},
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
