import { Flags } from '@oclif/core'

import { EnrolledChannel } from '@smartthings/core-sdk'

import { selectFromList, SelectFromListConfig } from '@smartthings/cli-lib'

import { chooseDriverFromChannel, chooseHub } from '../../../lib/commands/drivers-util'
import { EdgeCommand } from '../../../lib/edge-command'


export default class DriversInstallCommand extends EdgeCommand<typeof DriversInstallCommand.flags> {
	static description = 'install an edge driver onto a hub'

	static examples = [
		'smartthings edge:drivers:install                                         # use Q&A format to enter required values',
		'smartthings edge:drivers:install -H <hub-id>                             # specify the hub on the command line, other fields will be asked for',
		'smartthings edge:drivers:install -H <hub-id> -C <channel-id> <driver-id> # install a driver from a channel on an enrolled hub',
	]

	static flags = {
		...EdgeCommand.flags,
		hub: Flags.string({
			char: 'H',
			description: 'hub id',
			helpValue: '<UUID>',
		}),
		channel: Flags.string({
			char: 'C',
			description: 'channel id',
			helpValue: '<UUID>',
		}),
	}

	static args = [{
		name: 'driverId',
		description: 'id of driver to install',
	}]

	async chooseChannelFromEnrollments(hubId: string): Promise<string> {
		const config: SelectFromListConfig<EnrolledChannel> = {
			itemName: 'hub-enrolled channel',
			primaryKeyName: 'channelId',
			sortKeyName: 'name',
		}
		const listItems = (): Promise<EnrolledChannel[]> =>
			this.client.hubdevices.enrolledChannels(hubId)
		return selectFromList(this, config, {
			listItems,
			promptMessage: 'Select a channel to install the driver from.',
			configKeyForDefaultValue: 'defaultChannel',
		})
	}

	async run(): Promise<void> {
		const hubId = await chooseHub(this, 'Select a hub to install to.', this.flags.hub,
			{ useConfigDefault: true })
		const channelId = this.flags.channel ?? await this.chooseChannelFromEnrollments(hubId)
		const driverId = await chooseDriverFromChannel(this, channelId, this.args.driverId)
		await this.client.hubdevices.installDriver(driverId, hubId, channelId)
		this.log(`driver ${driverId} installed to hub ${hubId}`)
	}
}
