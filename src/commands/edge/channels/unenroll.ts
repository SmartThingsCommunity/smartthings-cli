import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type Device } from '@smartthings/core-sdk'

import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../../../lib/command/api-command.js'

import { chooseChannelFn } from '../../../lib/command/util/edge/channels-choose.js'
import { listOwnedHubs } from '../../../lib/command/util/hubs.js'
import { chooseHub } from '../../../lib/command/util/hubs-choose.js'


export const maxHubsToCheckForEnrollments = 15

export type CommandArgs =
	& APICommandFlags
	& {
		hubId?: string
		channel?: string
	}

const command = 'edge:channels:unenroll [hub-id]'

const describe = 'unenroll a hub from a channel'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiCommandBuilder(yargs)
		.positional('id', { describe: 'hub id', type: 'string' })
		.option('channel', { alias: 'C', describe: 'channel id', type: 'string' })
		.example([
			['$0 edge:channels:unenroll', 'prompt for channel and hub'],
			[
				'$0 edge:channels:unenroll 2fa0912f-cb73-424e-97f9-ffff76ea4f2a',
				'prompt user for a channel the given hub is enrolled in and then unenroll it',
			],
			[
				'$0 edge:channels:unenroll 2fa0912f-cb73-424e-97f9-ffff76ea4f2a ' +
					'--channel fcd6ca9c-2764-4dbb-9bbe-d40c900c960f',
				'unenroll the specified hub from the specified channel',
			],
		])

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	// A special listItems for `chooseHub` that will only include hubs which are enrolled in channels.
	const listItems = async (): Promise<Device[]> => {
		const hubs = await listOwnedHubs(command)
		const hubsWithChannels = await Promise.all(hubs.map(async hub =>
			({ hub, channels: await command.client.hubdevices.enrolledChannels(hub.deviceId) })))
		return hubsWithChannels
			.flat()
			.filter(({ channels }) => channels.length > 0)
			.map(({ hub }) => hub)
	}
	const hubId = await chooseHub(
		command,
		argv.hubId,
		{ useConfigDefault: true, listItems },
	)

	const channelId = await chooseChannelFn({ includeReadOnly: true })(
		command,
		argv.channel,
		{ listItems: () => command.client.hubdevices.enrolledChannels(hubId) },
	)

	await command.client.channels.unenrollHub(channelId, hubId)

	console.log(`Hub ${hubId} unenrolled from channel ${channelId}.`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
