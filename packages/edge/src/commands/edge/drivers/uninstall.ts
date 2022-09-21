import { Flags } from '@oclif/core'

import { EdgeCommand } from '../../../lib/edge-command'
import { chooseHub, chooseInstalledDriver } from '../../../lib/commands/drivers-util'


export default class DriversUninstallCommand extends EdgeCommand<typeof DriversUninstallCommand.flags> {
	static description = 'uninstall an edge driver from a hub'

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
		const driverId = await chooseInstalledDriver(this, hubId, 'Select a driver to uninstall.',
			this.args.driverId)
		await this.client.hubdevices.uninstallDriver(driverId, hubId)
		this.log(`driver ${driverId} uninstalled from hub ${hubId}`)
	}
}
