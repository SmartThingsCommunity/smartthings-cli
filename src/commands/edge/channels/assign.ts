import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { buildEpilog } from '../../../lib/help.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../../lib/command/api-organization-command.js'
import { chooseChannel } from '../../../lib/command/util/edge/channels-choose.js'
import { chooseDriver } from '../../../lib/command/util/drivers-choose.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& {
		driverId?: string
		driverVersion?: string
		channel?: string
	}

const command = 'edge:channels:assign [driver-id] [driver-version]'

const describe = 'assign a driver to a channel'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiOrganizationCommandBuilder(yargs)
		.positional('driver-id', { describe: 'driver id', type: 'string' })
		.positional('driver-version', { describe: 'driver version', type: 'string' })
		.option('channel', { alias: 'C', describe: 'channel to assigned to', type: 'string' })
		.example([
			['$0 edge:channels:assign', 'prompt for a channel and driver'],
			[
				'$0 edge:channels:assign 636169e4-8b9f-4438-a941-953b0d617231',
				'prompt for a channel and assign the specified driver to it',
			],
			[
				'$0 edge:channels:assign --channel 6ea857c6-23d4-4aae-aaf7-7a36daf42f92',
				'prompt for a driver and assign it to the specified channel',
			],
			[
				'$0 edge:channels:assign 636169e4-8b9f-4438-a941-953b0d617231' +
					' --channel 6ea857c6-23d4-4aae-aaf7-7a36daf42f92',
				'assign the specified driver to the specified channel',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'createDriverChannel' }))


const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const channelId = await chooseChannel(
		command,
		argv.channel,
		{ promptMessage: 'Select a channel for the driver.', useConfigDefault: true },
	)
	const driverId = await chooseDriver(command, argv.driverId, { promptMessage: 'Select a driver to assign.' })

	// If the version wasn't specified, grab it from the driver.
	const driverVersion = argv.driverVersion ?? (await command.client.drivers.get(driverId)).version

	await command.client.channels.assignDriver(channelId, driverId, driverVersion)

	console.log(`${driverId} (version ${driverVersion}) assigned to channel ${channelId}`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
