import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type InstalledDriver } from '@smartthings/core-sdk'

import { buildEpilog } from '../../../lib/help.js'
import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../../../lib/command/api-command.js'
import {
	outputItemOrList,
	outputItemOrListBuilder,
	type OutputItemOrListConfig,
	type OutputItemOrListFlags,
} from '../../../lib/command/listing-io.js'
import { chooseHub } from '../../../lib/command/util/hubs-choose.js'
import { withChannelNames, type WithNamedChannel } from '../../../lib/command/util/edge/channels.js'


export type CommandArgs =
	& APICommandFlags
	& OutputItemOrListFlags
	& {
		hub?: string
		device?: string
		verbose: boolean
		idOrIndex?: string
	}

const command = 'edge:drivers:installed [id-or-index]'

const describe = 'list all drivers installed on a given hub'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemOrListBuilder(apiCommandBuilder(yargs))
		.positional('id-or-index', { describe: 'driver id or number in list', type: 'string' })
		.option('hub', { alias: 'H', describe: 'hub id', type: 'string' })
		.option('device', { describe: 'include only drivers matching the device', type: 'string' })
		.option('verbose', { alias: 'v', describe: 'include channel name in output', type: 'boolean', default: false })
		.example([
			['$0 smartthings edge:drivers:installed', 'list all installed drivers'],
			[
				'$0 smartthings edge:drivers:installed --verbose',
				'list all installed drivers and include the channel name in the output',
			],
			[
				'$0 smartthings edge:drivers:installed 1',
				'list the first driver in the list retrieved by running "smartthings edge:drivers:installed',
			],
			[
				'$0 smartthings edge:drivers:installed 3f9f151d-3022-4b9f-814a-afcbf69b650f',
				'display details for an installed driver by id',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: ['listHubInstalledDrivers', 'getHubDeviceDriver'] }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const config: OutputItemOrListConfig<InstalledDriver & WithNamedChannel> = {
		primaryKeyName: 'driverId',
		sortKeyName: 'name',
		tableFieldDefinitions: ['name', 'driverId', 'description', 'version', 'channelId',
			'developer', 'vendorSupportInformation'],
		listTableFieldDefinitions: ['name', 'driverId', 'version', 'channelId'],
	}
	if (argv.verbose) {
		config.tableFieldDefinitions.splice(4, 0, 'channelName')
		config.listTableFieldDefinitions.splice(3, 0, 'channelName')
	}
	const listInstalledWrapper: (drivers: Promise<InstalledDriver[]>) => Promise<(InstalledDriver & WithNamedChannel)[]> =
		argv.verbose ? async drivers => withChannelNames(command.client, await drivers) : drivers => drivers
	const getInstalledWrapper: (driver: Promise<InstalledDriver>) => Promise<InstalledDriver & WithNamedChannel> =
		argv.verbose ? async driver => withChannelNames(command.client, await driver) : driver => driver

	const hubId = await chooseHub(
		command,
		argv.hub,
		{ promptMessage: 'Select a hub.', allowIndex: true, useConfigDefault: true },
	)

	await outputItemOrList(
		command,
		config,
		argv.idOrIndex,
		() => listInstalledWrapper(command.client.hubdevices.listInstalled(hubId, argv.device)),
		id => getInstalledWrapper(command.client.hubdevices.getInstalled(hubId, id)),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
