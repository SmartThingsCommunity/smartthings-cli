import { Flags } from '@oclif/core'

import { Device, DeviceIntegrationType } from '@smartthings/core-sdk'

import { chooseDevice } from '@smartthings/cli-lib'

import { EdgeCommand } from '../../../lib/edge-command'
import { chooseDriver, chooseHub, listAllAvailableDrivers, listMatchingDrivers }
	from '../../../lib/commands/drivers-util'


export default class DriversSwitchCommand extends EdgeCommand<typeof DriversSwitchCommand.flags> {
	static description = 'change the driver used by an installed device'

	static examples = [`# switch driver, prompting user for all necessary input
$ smartthings edge:drivers:switch

# switch driver, including all necessary input on the command line
$ smartthings edge:drivers:switch --hub <hub-id> --driver <driver-id> <device-id>`,
	`
# include all available drivers in prompt, even if they don't match the chosen device
$ smartthings edge:drivers:switch --include-non-matching`,
	]

	static flags = {
		...EdgeCommand.flags,
		hub: Flags.string({
			char: 'H',
			description: 'hub id',
			helpValue: '<UUID>',
		}),
		driver: Flags.string({
			char: 'd',
			description: 'id of new driver to use',
			helpValue: '<UUID>',
		}),
		// eslint-disable-next-line @typescript-eslint/naming-convention
		'include-non-matching': Flags.boolean({
			char: 'I',
			description: 'when presenting a list of drivers to switch to, include drivers that do not match the device',
		}),
	}

	static args = [{
		name: 'deviceId',
		description: 'id of device to update',
	}]

	async run(): Promise<void> {
		const hubId = await chooseHub(this, 'Which hub is the device connected to?',
			this.flags.hub, { useConfigDefault: true })
		const deviceListFilter = (device: Device): boolean =>
			device.type === DeviceIntegrationType.LAN && device.lan?.hubId === hubId ||
			device.type === DeviceIntegrationType.MATTER && device.matter?.hubId === hubId ||
			device.type === DeviceIntegrationType.ZIGBEE && device.zigbee?.hubId === hubId ||
			device.type === DeviceIntegrationType.ZWAVE && device.zwave?.hubId === hubId

		const deviceListOptions = {
			type: [
				DeviceIntegrationType.LAN,
				DeviceIntegrationType.MATTER,
				DeviceIntegrationType.ZIGBEE,
				DeviceIntegrationType.ZWAVE,
			],
		}
		const deviceId = await chooseDevice(this, this.args.deviceId, { deviceListOptions, deviceListFilter })

		const listItems = this.flags['include-non-matching']
			? () => listAllAvailableDrivers(this.client, deviceId, hubId)
			: () => listMatchingDrivers(this.client, deviceId, hubId)
		const driverId = await chooseDriver(this, 'Choose a driver to use.', this.flags.driver,
			{ listItems })

		await this.client.hubdevices.switchDriver(driverId, hubId, deviceId)
		this.log(`updated driver for device ${deviceId} to ${driverId}`)
	}
}
