import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { buildEpilog } from '../../../lib/help.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../../lib/command/api-organization-command.js'
import { chooseChannelFn } from '../../../lib/command/util/edge/channels-choose.js'
import { chooseDriverFromChannelFn } from '../../../lib/command/util/drivers-choose.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& {
		driverId?: string
		channel?: string
	}

const command = 'edge:channels:unassign [driver-id]'

const describe = 'remove a driver from a channel'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiOrganizationCommandBuilder(yargs)
		.positional('driver-id', { describe: 'driver id', type: 'string' })
		.option('channel', { alias: 'C', describe: 'channel to unassigned from', type: 'string' })
		.example([
			['$0 edge:channels:unassign', 'prompt for a channel and driver'],
			[
				'$0 edge:channels:unassign 636169e4-8b9f-4438-a941-953b0d617231',
				'prompt for a channel and remove the specified driver from it',
			],
			[
				'$0 edge:channels:unassign --channel 6ea857c6-23d4-4aae-aaf7-7a36daf42f92',
				'prompt for a driver and remove it from the specified channel',
			],
			[
				'$0 edge:channels:unassign 636169e4-8b9f-4438-a941-953b0d617231' +
					' --channel 6ea857c6-23d4-4aae-aaf7-7a36daf42f92',
				'remove the specified driver from the specified channel',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'deleteDriverChannel' }))


const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const channelId = await chooseChannelFn({ withDriverId: argv.driverId })(
		command,
		argv.channel,
		{ useConfigDefault: true },
	)
	const driverId = await chooseDriverFromChannelFn(channelId)(
		command,
		argv.driverId,
		{ promptMessage: 'Select a driver to remove from the selected channel:' },
	)

	await command.client.channels.unassignDriver(channelId, driverId)

	console.log(`${driverId} removed from channel ${channelId}`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
