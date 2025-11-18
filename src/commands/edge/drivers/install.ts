import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type EnrolledChannel } from '@smartthings/core-sdk'

import { buildEpilog } from '../../../lib/help.js'
import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../../../lib/command/api-command.js'
import { selectFromList, type SelectFromListConfig } from '../../../lib/command/select.js'
import { chooseDriverFromChannelFn } from '../../../lib/command/util/drivers-choose.js'
import { chooseHub } from '../../../lib/command/util/hubs-choose.js'


export type CommandArgs =
	& APICommandFlags
	& {
		hub?: string
		channel?: string
		driver?: string
	}

const command = 'edge:drivers:install [driver]'

const describe = 'install an edge driver onto a hub'


const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiCommandBuilder(yargs)
		.positional('driver-id', { describe: 'id of driver to install', type: 'string' })
		.option('hub', { alias: 'H', describe: 'hub on which to install the driver', type: 'string' })
		.option('channel', { alias: 'C', describe: 'channel that contains the driver being installed', type: 'string' })
		.example([
			['$0 edge:drivers:install', 'install a driver in interactive mode'],
			[
				'$0 edge:drivers:install --hub 5dfd6626-ab1d-42da-bb76-90def3153998',
				'specify the hub on the command line, other fields will be asked for',
			],
			[
				'$0 edge:drivers:install --hub 5dfd6626-ab1d-42da-bb76-90def3153998' +
					' --channel da1774a6-1901-44f2-90ad-972a85f9bd8a d6a4ad8f-a855-444d-b06b-1a64ab8aa130',
				'install a driver from a channel on an enrolled hub',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'installDrivers' }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const chooseChannelFromEnrollments = async (hubId: string): Promise<string> => {
		const config: SelectFromListConfig<EnrolledChannel> = {
			itemName: 'hub-enrolled channel',
			primaryKeyName: 'channelId',
			sortKeyName: 'name',
		}
		const listItems = (): Promise<EnrolledChannel[]> => command.client.hubdevices.enrolledChannels(hubId)
		return selectFromList(
			command,
			config,
			{ listItems, promptMessage: 'Select a channel to install the driver from.' },
		)
	}
	const hubId = await chooseHub(
		command,
		argv.hub,
		{ promptMessage: 'Select a hub to install to.', useConfigDefault: true },
	)
	const channelId = argv.channel ?? await chooseChannelFromEnrollments(hubId)
	const driverId = await chooseDriverFromChannelFn(channelId)(
		command,
		argv.driver,
		{ promptMessage: 'Select a driver to install.' },
	)
	await command.client.hubdevices.installDriver(driverId, hubId, channelId)
	console.log(`driver ${driverId} installed to hub ${hubId}`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
