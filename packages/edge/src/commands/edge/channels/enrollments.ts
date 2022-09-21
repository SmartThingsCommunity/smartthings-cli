import { EnrolledChannel } from '@smartthings/core-sdk'

import { outputList, OutputListConfig } from '@smartthings/cli-lib'

import { chooseHub } from '../../../lib/commands/drivers-util'
import { EdgeCommand } from '../../../lib/edge-command'


export default class ChannelsEnrollmentsCommand extends EdgeCommand<typeof ChannelsEnrollmentsCommand.flags> {
	static description = 'list all channels a given hub is enrolled in'

	static flags = {
		...EdgeCommand.flags,
		...outputList.flags,
	}

	static args = [{
		name: 'idOrIndex',
		description: 'the hub id or number in list',
	}]

	async run(): Promise<void> {
		const config: OutputListConfig<EnrolledChannel> = {
			primaryKeyName: 'channelId',
			sortKeyName: 'name',
			listTableFieldDefinitions: ['channelId', 'name', 'description', 'createdDate', 'lastModifiedDate', 'subscriptionUrl'],
		}

		const hubId = await chooseHub(this, 'Select a hub.', this.args.idOrIndex,
			{ allowIndex: true, useConfigDefault: true })

		await outputList(this, config, () => this.client.hubdevices.enrolledChannels(hubId))
	}
}
