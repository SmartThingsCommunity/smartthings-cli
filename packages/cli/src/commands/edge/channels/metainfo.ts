import { Flags } from '@oclif/core'

import { EdgeDriver } from '@smartthings/core-sdk'

import { outputItemOrList, OutputItemOrListConfig } from '@smartthings/cli-lib'

import { EdgeCommand } from '../../../lib/edge-command'
import { chooseChannel } from '../../../lib/commands/channels-util'
import { buildTableOutput, listTableFieldDefinitions } from '../../../lib/commands/drivers-util'


export default class ChannelsMetaInfoCommand extends EdgeCommand<typeof ChannelsMetaInfoCommand.flags> {
	static description = 'list all channels owned by you or retrieve a single channel'

	static flags = {
		...EdgeCommand.flags,
		...outputItemOrList.flags,
		channel: Flags.string({
			char: 'C',
			description: 'channel id',
			exclusive: ['input'],
			helpValue: '<UUID>',
		}),
	}

	static args = [{
		name: 'idOrIndex',
		description: 'the channel id or number in list',
	}]

	static examples = [`# summarize metainfo for all drivers in a channel
$ smartthings edge:channels:metainfo

# summarize metainfo for all drivers in the specified channel
$ smartthings edge:channels:metainfo -C b50c0aa1-d9ea-4005-8db8-0cf9c2d9d7b2

# display metainfo about the third driver listed in the above command
$ smartthings edge:channels:metainfo -C b50c0aa1-d9ea-4005-8db8-0cf9c2d9d7b2 3`,
	`
# display metainfo about a driver by using its id
$ smartthings edge:channels:metainfo -C b50c0aa1-d9ea-4005-8db8-0cf9c2d9d7b2 699c7308-8c72-4363-9571-880d0f5cc725`]

	async run(): Promise<void> {
		const channelId = await chooseChannel(this, 'Choose a channel to get meta info for.',
			this.flags.channel, { useConfigDefault: true })

		const config: OutputItemOrListConfig<EdgeDriver> = {
			primaryKeyName: 'driverId',
			sortKeyName: 'name',
			buildTableOutput: (driver: EdgeDriver) => buildTableOutput(this.tableGenerator, driver),
			listTableFieldDefinitions,
		}

		const listDriversMetaInfo = async (): Promise<EdgeDriver[]> => {
			const drivers = await this.client.channels.listAssignedDrivers(channelId)
			return Promise.all(drivers.map(async driver =>
				await this.client.channels.getDriverChannelMetaInfo(channelId, driver.driverId)))
		}

		await outputItemOrList(this, config, this.args.idOrIndex,
			listDriversMetaInfo,
			driverId => this.client.channels.getDriverChannelMetaInfo(channelId, driverId))
	}
}
