import { outputList, OutputListConfig } from '@smartthings/cli-lib'

import { DriverChannelDetailsWithName, listAssignedDriversWithNames } from '../../../lib/commands/drivers-util'
import { chooseChannel } from '../../../lib/commands/channels-util'
import { EdgeCommand } from '../../../lib/edge-command'


export default class ChannelsDriversCommand extends EdgeCommand<typeof ChannelsDriversCommand.flags> {
	static description = 'list all drivers assigned to a given channel'

	static flags = {
		...EdgeCommand.flags,
		...outputList.flags,
	}

	static args = [{
		name: 'idOrIndex',
		description: 'the channel id or number in list',
	}]

	static aliases = ['edge:channels:assignments']

	async run(): Promise<void> {
		const config: OutputListConfig<DriverChannelDetailsWithName> = {
			primaryKeyName: 'channelId',
			sortKeyName: 'version',
			listTableFieldDefinitions: ['name', 'driverId', 'version', 'createdDate', 'lastModifiedDate'],
		}

		const channelId = await chooseChannel(this, 'Select a channel.', this.args.idOrIndex,
			{ allowIndex: true, includeReadOnly: true, useConfigDefault: true })

		await outputList(this, config, () => listAssignedDriversWithNames(this.client, channelId))
	}
}
