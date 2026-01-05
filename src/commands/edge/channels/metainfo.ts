import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import type { EdgeDriver } from '@smartthings/core-sdk'

import { buildEpilog } from '../../../lib/help.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../../lib/command/api-organization-command.js'
import {
	outputItemOrList,
	outputItemOrListBuilder,
	type OutputItemOrListConfig,
	type OutputItemOrListFlags,
} from '../../../lib/command/listing-io.js'
import { buildTableOutput, listTableFieldDefinitions } from '../../../lib/command/util/edge-drivers.js'
import { chooseChannel } from '../../../lib/command/util/edge/channels-choose.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& OutputItemOrListFlags
	& {
		driverIdOrIndex?: string
		channel?: string
	}

const command = 'edge:channels:metainfo [driver-id-or-index]'

const describe = 'display metadata about drivers assigned to channels'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemOrListBuilder(apiOrganizationCommandBuilder(yargs))
		.positional('id-or-index', { describe: 'driver id or number in list', type: 'string' })
		.option('channel', { alias: 'C', describe: 'channel id', type: 'string' })
		.example([
			[
				'$0 edge:channels:metainfo',
				'prompt for a channel and summarize metainfo for drivers assigned to it',
			],
			[
				'$0 edge:channels:metainfo --channel b50c0aa1-d9ea-4005-8db8-0cf9c2d9d7b2',
				'summarize metainfo for drivers assigned to the specified channel',
			],
			[
				'$0 edge:channels:metainfo -C b50c0aa1-d9ea-4005-8db8-0cf9c2d9d7b2 3',
				'display metainfo about the third driver listed in the above command',
			],
			[
				'$0 edge:channels:metainfo --channel b50c0aa1-d9ea-4005-8db8-0cf9c2d9d7b2' +
					' 699c7308-8c72-4363-9571-880d0f5cc725',
				'display metainfo about a driver by using its channel and id',
			],
		])
		.epilog(buildEpilog({ command }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const channelId = await chooseChannel(
		command,
		argv.channel,
		{ useConfigDefault: true, promptMessage: 'Choose a channel to get meta info for.' },
	)

	const config: OutputItemOrListConfig<EdgeDriver> = {
		primaryKeyName: 'driverId',
		sortKeyName: 'name',
		buildTableOutput: (driver: EdgeDriver) => buildTableOutput(command.tableGenerator, driver),
		listTableFieldDefinitions,
	}

	const listDriversMetaInfo = async (): Promise<EdgeDriver[]> => {
		const drivers = await command.client.channels.listAssignedDrivers(channelId)
		return Promise.all(drivers.map(async driver =>
			await command.client.channels.getDriverChannelMetaInfo(channelId, driver.driverId)))
	}

	await outputItemOrList(
		command,
		config,
		argv.driverIdOrIndex,
		listDriversMetaInfo,
		driverId => command.client.channels.getDriverChannelMetaInfo(channelId, driverId),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
