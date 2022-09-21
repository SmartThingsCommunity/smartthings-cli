import { Flags } from '@oclif/core'

import { chooseChannel } from '../../../lib/commands/channels-util'
import { chooseDriver } from '../../../lib/commands/drivers-util'
import { EdgeCommand } from '../../../lib/edge-command'


export class ChannelsAssignCommand extends EdgeCommand<typeof ChannelsAssignCommand.flags> {
	static description = 'assign a driver to a channel'

	static flags = {
		...EdgeCommand.flags,
		channel: Flags.string({
			char: 'C',
			description: 'channel id',
			helpValue: '<UUID>',
		}),
	}

	static args = [
		{
			name: 'driverId',
			description: 'driver id',
		},
		{
			name: 'version',
			description: 'driver version',
		},
	]

	static aliases = ['edge:drivers:publish']

	async run(): Promise<void> {
		const channelId = await chooseChannel(this, 'Select a channel for the driver.',
			this.flags.channel, { useConfigDefault: true })
		const driverId = await chooseDriver(this, 'Select a driver to assign.', this.args.driverId)

		// If the version wasn't specified, grab it from the driver.
		const version = this.args.version ?? (await this.client.drivers.get(driverId)).version

		await this.client.channels.assignDriver(channelId, driverId, version)

		this.log(`${driverId} ${this.args.version ? `(version ${this.args.version})` : ''} assigned to channel ${channelId}`)
	}
}
