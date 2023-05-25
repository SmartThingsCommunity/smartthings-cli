import { Flags } from '@oclif/core'

import { InstalledDriver } from '@smartthings/core-sdk'

import { outputItemOrList, OutputItemOrListConfig } from '@smartthings/cli-lib'

import { chooseHub } from '../../../lib/commands/drivers-util.js'
import { EdgeCommand } from '../../../lib/edge-command.js'
import { WithNamedChannel, withChannelNames } from '../../../lib/commands/channels-util.js'


export default class DriversInstalledCommand extends EdgeCommand<typeof DriversInstalledCommand.flags> {
	static description = 'list all drivers installed on a given hub' +
		this.apiDocsURL('listHubInstalledDrivers', 'getHubDeviceDriver')

	static flags = {
		...EdgeCommand.flags,
		...outputItemOrList.flags,
		hub: Flags.string({
			char: 'H',
			description: 'hub id',
			helpValue: '<UUID>',
		}),
		device: Flags.string({
			description: 'return drivers matching the specified device',
			helpValue: '<UUID>',
		}),
		verbose: Flags.boolean({
			description: 'include channel name in output',
			char: 'v',
		}),
	}

	static args = [{
		name: 'idOrIndex',
		description: 'the driver id or number in list',
	}]

	static examples = [
		{
			description: 'list all installed drivers',
			command: 'smartthings edge:drivers:installed',
		},
		{
			description: 'list all installed drivers and include the channel name in the output',
			command: 'smartthings edge:drivers:installed --verbose',
		},
		{
			description: 'list the first driver in the list retrieved by running "smartthings edge:drivers:installed"',
			command: 'smartthings edge:drivers:installed 1',
		},
		{
			description: 'list an installed driver by id',
			command: 'smartthings edge:drivers:installed <driver-id>',
		},
	]

	async run(): Promise<void> {
		const config: OutputItemOrListConfig<InstalledDriver & WithNamedChannel> = {
			primaryKeyName: 'driverId',
			sortKeyName: 'name',
			tableFieldDefinitions: ['name', 'driverId', 'description', 'version', 'channelId',
				'developer', 'vendorSupportInformation'],
			listTableFieldDefinitions: ['name', 'driverId', 'version', 'channelId'],
		}
		if (this.flags.verbose) {
			config.tableFieldDefinitions.splice(4, 0, 'channelName')
			config.listTableFieldDefinitions.splice(3, 0, 'channelName')
		}
		const listInstalledWrapper: (drivers: Promise<InstalledDriver[]>) => Promise<(InstalledDriver & WithNamedChannel)[]> =
			this.flags.verbose ? async drivers => withChannelNames(this.client, await drivers) : drivers => drivers
		const getInstalledWrapper: (driver: Promise<InstalledDriver>) => Promise<InstalledDriver & WithNamedChannel> =
			this.flags.verbose ? async driver => withChannelNames(this.client, await driver) : driver => driver

		const hubId = await chooseHub(this, 'Select a hub.', this.flags.hub,
			{ allowIndex: true, useConfigDefault: true })

		await outputItemOrList(this, config, this.args.idOrIndex,
			() => listInstalledWrapper(this.client.hubdevices.listInstalled(hubId, this.flags.device)),
			id => getInstalledWrapper(this.client.hubdevices.getInstalled(hubId, id)))
	}
}
