import { Flags } from '@oclif/core'

import { OutputItemOrListConfig, outputItemOrList } from '@smartthings/cli-lib'

import { EdgeCommand } from '../../../lib/edge-command'
import { DeviceDriverInfo, getDriverDevices } from '../../../lib/commands/drivers-util'


export default class DriversDevicesCommand extends EdgeCommand<typeof DriversDevicesCommand.flags> {
	static description = 'list devices using edge drivers' +
		this.apiDocsURL('getDevices', 'listDrivers', 'getDriver', 'getDriverRevision') // TODO: update this list

	static flags = {
		...EdgeCommand.flags,
		...outputItemOrList.flags,
		hub: Flags.string({
			char: 'H',
			description: 'hub id',
			helpValue: '<UUID>',
		}),
		driver: Flags.string({
			char: 'D',
			description: 'driver id',
			helpValue: '<UUID>',
		}),
	}

	static args = [{
		name: 'idOrIndex',
		description: 'the device id or number in list',
	}]

	static examples = [`# list all devices using edge drivers
$ smartthings edge:drivers:devices

# display details about the third device listed in the above command
$ smartthings edge:drivers:devices 3`,
	`
# display details about a device by using its id
$ smartthings edge:drivers:devices dfda0a8e-55d6-445b-ace5-db828679bcb3

# list all devices using edge drivers on the specified hub
$ smartthings edge:drivers:devices --hub a9108ab1-7087-4c10-9781-a0627b084fce

# list devices that use a specific driver
$ smartthings edge:drivers:devices --driver b67a134c-ace8-4b8d-9a0e-444ad78b4455`]

	async run(): Promise<void> {
		const config: OutputItemOrListConfig<DeviceDriverInfo> = {
			primaryKeyName: 'deviceId',
			sortKeyName: 'label',
			tableFieldDefinitions: ['label', 'type', 'deviceId', 'driverId', 'hubId', 'hubLabel'],
			listTableFieldDefinitions: ['label', 'type', 'deviceId', 'driverId'],
		}

		const matchesUserFilters = (device: DeviceDriverInfo): boolean => {
			if (this.flags.hub && device.hubId !== this.flags.hub) {
				return false
			}
			if (this.flags.driver && device.driverId !== this.flags.driver) {
				return false
			}
			return true
		}

		const matchingDevices = (await getDriverDevices(this.client)).filter(matchesUserFilters)

		const list = async (): Promise<DeviceDriverInfo[]> => matchingDevices

		const get = async (id: string): Promise<DeviceDriverInfo> => {
			const match = matchingDevices.find(device => device.deviceId === id)
			if (match) {
				return match
			}
			throw Error(`Could not find device with id ${id}`)
		}

		await outputItemOrList(this, config, this.args.idOrIndex, list, get)
	}
}
