import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { apiCommand, apiCommandBuilder, type APICommandFlags, apiDocsURL } from '../../../lib/command/api-command.js'
import {
	outputItemOrList,
	outputItemOrListBuilder,
	type OutputItemOrListConfig,
	type OutputItemOrListFlags,
} from '../../../lib/command/listing-io.js'
import { type DeviceDriverInfo, getDriverDevices } from '../../../lib/command/util/edge-drivers.js'


export type CommandArgs =
	& APICommandFlags
	& OutputItemOrListFlags
	& {
		hub?: string
		driver?: string
		idOrIndex?: string
	}

const command = 'edge:drivers:devices [id-or-index]'

const describe = 'list devices using edge drivers'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemOrListBuilder(apiCommandBuilder(yargs))
		.positional('id-or-index', { describe: 'device id or number in list', type: 'string' })
		.option('hub', { alias: 'H', describe: 'hub id', type: 'string' })
		.option('driver', { alias: 'D', describe: 'driver id', type: 'string' })
		.example([
			['$0 edge:drivers:devices', 'list all devices using edge drivers'],
			[
				'$0 edge:drivers:devices 3',
				'display details about the third device listed in the above command',
			],
			[
				'$0 edge:drivers:devices dfda0a8e-55d6-445b-ace5-db828679bcb3',
				'display details about a device by id',
			],
			[
				'$0 edge:edge:drivers:devices --hub a9108ab1-7087-4c10-9781-a0627b084fce',
				'list all devices using edge drivers on the specified hub',
			],
			[
				'$0 edge:drivers:devices --driver b67a134c-ace8-4b8d-9a0e-444ad78b4455',
				'list devices that use the specified driver',
			],
		])
		.epilog(apiDocsURL('getDevices', 'listDrivers', 'getDriver', 'getDriverRevision'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const config: OutputItemOrListConfig<DeviceDriverInfo> = {
		primaryKeyName: 'deviceId',
		sortKeyName: 'label',
		tableFieldDefinitions: ['label', 'type', 'deviceId', 'driverId', 'hubId', 'hubLabel'],
		listTableFieldDefinitions: ['label', 'type', 'deviceId', 'driverId'],
	}

	const matchesUserFilters = (device: DeviceDriverInfo): boolean => {
		if (argv.hub && device.hubId !== argv.hub) {
			return false
		}
		if (argv.driver && device.driverId !== argv.driver) {
			return false
		}
		return true
	}

	const matchingDevices = (await getDriverDevices(command.client)).filter(matchesUserFilters)

	const list = async (): Promise<DeviceDriverInfo[]> => matchingDevices

	const get = async (id: string): Promise<DeviceDriverInfo> => {
		const match = matchingDevices.find(device => device.deviceId === id)
		if (match) {
			return match
		}
		throw Error(`Could not find device with id ${id}`)
	}

	await outputItemOrList(command, config, argv.idOrIndex, list, get)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
