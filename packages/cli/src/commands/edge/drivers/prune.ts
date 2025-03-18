import { Flags } from '@oclif/core'

import { EdgeCommand } from '../../../lib/edge-command'
import { chooseHub, getDriverDevices } from '../../../lib/commands/drivers-util'
import { FormatAndWriteItemConfig, askForBoolean, formatAndWriteItem } from '@smartthings/cli-lib'
import { InstalledDriver } from '@smartthings/core-sdk'


export default class DriversPruneCommand extends EdgeCommand<typeof DriversPruneCommand.flags> {
	static description = 'uninstall unused edge drivers from a hub' +
		this.apiDocsURL('uninstallDriver') // TODO: update

	static flags = {
		...EdgeCommand.flags,
		hub: Flags.string({
			char: 'H',
			description: 'hub id',
			helpValue: '<UUID>',
		}),
	}

	static args = [{
		name: 'driverId',
		description: 'id of driver to uninstall',
	}]

	async run(): Promise<void> {
		const hubId = await chooseHub(this, 'Select a hub to uninstall from.', this.flags.hub,
			{ useConfigDefault: true })

		const installedDrivers = await this.client.hubdevices.listInstalled(hubId)
		const isDefined = (item?: string): item is string => item != null
		const inUseDriverIds = (await getDriverDevices(this.client))
			.map(info => info.driverId)
			.filter(isDefined)
			.flat()

		// LAN drivers can be automatically re-installed so we don't allow pruning them.
		// no ocean currents here :-)
		const defaultLANDrivers = (await this.client.drivers.listDefault())
			.filter(driver => driver.permissions?.find(permission => permission.name === 'lan'))
			.map(driver => driver.driverId)
		const prunableDrivers = installedDrivers
			.filter(driver => !inUseDriverIds.includes(driver.driverId))
			.filter(driver => !defaultLANDrivers.includes(driver.driverId))

		if (prunableDrivers.length === 0) {
			console.log('No unused drivers found.')
		} else {
			console.log(`Found ${prunableDrivers.length} unused drivers.`)
			const config: FormatAndWriteItemConfig<InstalledDriver> = {
				tableFieldDefinitions: [
					'driverId',
					'name',
					{ prop: 'description', skipEmpty: true },
					'version',
					'channelId',
					'developer',
					{ prop: 'vendorSupportInformation', skipEmpty: true },
				],
			}
			for (const prunableDriver of prunableDrivers) {
				console.log('\n\nFound unused driver:')
				await formatAndWriteItem(this, config, prunableDriver)
				const doUninstall = await askForBoolean(`Uninstall ${prunableDriver.name} driver?`, { default: false })
				if (doUninstall) {
					await this.client.hubdevices.uninstallDriver(prunableDriver.driverId, hubId)
					this.log(`driver ${prunableDriver.driverId} uninstalled from hub ${hubId}`)
				} else {
					console.log(`Left driver ${prunableDriver.name} installed.`)
				}
			}
		}
	}
}
