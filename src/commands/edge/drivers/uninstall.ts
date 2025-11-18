import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type InstalledDriver } from '@smartthings/core-sdk'

import { buildEpilog } from '../../../lib/help.js'
import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../../../lib/command/api-command.js'
import { chooseDriver } from '../../../lib/command/util/drivers-choose.js'
import { chooseHubFn } from '../../../lib/command/util/hubs-choose.js'


export type CommandArgs =
	& APICommandFlags
	& {
		driverId?: string
		hub?: string
	}

const command = 'edge:drivers:uninstall [driver-id]'

const describe = 'uninstall an edge driver from a hub'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiCommandBuilder(yargs)
		.positional('driver-id', { describe: 'id of driver to uninstall', type: 'string' })
		.option('hub', { alias: 'H', describe: 'hub id', type: 'string' })
		.example([
			['$0 edge:drivers:uninstall', 'prompt for a hub and driver and uninstall the driver from the hub'],
			[
				'$0 edge:drivers:uninstall e61b9758-dfd5-4256-8a68-e411e38572b6',
				'uninstall the specified driver',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'uninstallDriver' }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const hubId = await chooseHubFn({ withInstalledDriverId: argv.driverId })(
		command,
		argv.hub,
		{ promptMessage: 'Select a hub to uninstall from.' },
	)

	const listInstalledDrivers = (): Promise<InstalledDriver[]> => command.client.hubdevices.listInstalled(hubId)
	const driverId = await chooseDriver(
		command,
		argv.driverId,
		{ promptMessage: 'Select a driver to uninstall.', listItems: listInstalledDrivers },
	)
	await command.client.hubdevices.uninstallDriver(driverId, hubId)
	console.log(`Driver ${driverId} uninstalled from hub ${hubId}.`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
