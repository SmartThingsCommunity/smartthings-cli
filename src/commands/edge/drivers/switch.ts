import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type Device, DeviceIntegrationType } from '@smartthings/core-sdk'

import { buildEpilog } from '../../../lib/help.js'
import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../../../lib/command/api-command.js'
import { chooseDeviceFn } from '../../../lib/command/util/devices-choose.js'
import { chooseDriver } from '../../../lib/command/util/drivers-choose.js'
import { edgeDeviceTypes, listAllAvailableDrivers, listMatchingDrivers } from '../../../lib/command/util/edge-drivers.js'
import { chooseHub } from '../../../lib/command/util/hubs-choose.js'


export type CommandArgs =
	& APICommandFlags
	& {
		deviceId?: string
		hub?: string
		driver?: string
		includeNonMatching?: boolean
	}

const command = 'edge:drivers:switch [device-id]'

const describe = 'change the driver used by an installed device'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiCommandBuilder(yargs)
		.positional('device-id', { describe: 'id of device to update', type: 'string' })
		.option('hub', { alias: 'H', describe: 'hub id', type: 'string' })
		.option('driver', { alias: 'd', describe: 'id of new driver to use', type: 'string' })
		.option(
			'include-non-matching',
			{
				alias: 'I',
				describe: 'when presenting a list of drivers, include drivers that do not match the device',
				type: 'boolean',
				default: false,
			},
		)
		.example([
			['$0 edge:drivers:switch', 'prompt for all necessary input'],
			[
				'$0 edge:drivers:switch --hub b0cd47c6-2bbd-45f7-9726-6dcd374b8eb3' +
					' --driver a5b0af0c-234a-4a8c-a927-6d70f91ad690 261131fb-916f-4936-a671-51b95360fe8e',
				'switch to driver a5b0af... for device 261131... on hub b0cd47...',
			],
			[
				'$0 edge:drivers:switch --include-non-matching',
				"include all available drivers in prompt, even if they don't match the chosen device",
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'updateHubDevice' }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const hubId = await chooseHub(
		command,
		argv.hub,
		{ promptMessage: 'Which hub is the device connected to?', useConfigDefault: true },
	)
	const deviceListFilter = (device: Device): boolean =>
		device.type === DeviceIntegrationType.LAN && device.lan?.hubId === hubId ||
		device.type === DeviceIntegrationType.MATTER && device.matter?.hubId === hubId ||
		device.type === DeviceIntegrationType.ZIGBEE && device.zigbee?.hubId === hubId ||
		device.type === DeviceIntegrationType.ZWAVE && device.zwave?.hubId === hubId

	const deviceListOptions = {
		type: edgeDeviceTypes,
	}
	const deviceId = await chooseDeviceFn(deviceListOptions)(
		command,
		argv.deviceId,
		{ listFilter: deviceListFilter },
	)

	const matchingDrivers = await listMatchingDrivers(command.client, deviceId, hubId)
	const listItems = argv.includeNonMatching
		? () => listAllAvailableDrivers(command.client, deviceId, hubId)
		: async () => matchingDrivers
	const driverId = await chooseDriver(
		command,
		argv.driver,
		{ promptMessage: 'Choose a driver to use.', listItems },
	)
	const forceUpdate = argv.includeNonMatching && !matchingDrivers.find(driver => driver.driverId === driverId)

	await command.client.hubdevices.switchDriver(driverId, hubId, deviceId, forceUpdate)
	console.log(`Updated driver for device ${deviceId} to ${driverId}.`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
