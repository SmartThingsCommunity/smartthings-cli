import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'


import { type InstalledDriver } from '@smartthings/core-sdk'

import { buildEpilog } from '../../../lib/help.js'
import { booleanInput } from '../../../lib/user-query.js'
import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../../../lib/command/api-command.js'
import { formatAndWriteItem, type FormatAndWriteItemConfig } from '../../../lib/command/format.js'
import { getDriverDevices } from '../../../lib/command/util/edge-drivers.js'
import { chooseHub } from '../../../lib/command/util/hubs-choose.js'


export type CommandArgs =
	& APICommandFlags
	& {
		hub?: string
	}

const command = 'edge:drivers:prune'

const describe = 'uninstall unused edge drivers from a hub'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiCommandBuilder(yargs)
		.option('hub', { alias: 'H', describe: 'hub id', type: 'string' })
		.example([
			['$0 edge:drivers:prune', 'prompt for a hub and prune its drivers'],
			[
				'$0 edge:drivers:prune --hub b0cd47c6-2bbd-45f7-9726-6dcd374b8eb3' +
				'prune drivers on the specified hub',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'uninstallDriver' }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const hubId = await chooseHub(
		command,
		argv.hub,
		{ promptMessage: 'Select a hub to prune drivers on.', useConfigDefault: true },
	)

	const installedDrivers = await command.client.hubdevices.listInstalled(hubId)
	const isDefined = (item?: string): item is string => item != null
	const inUseDriverIds = (await getDriverDevices(command.client))
		.map(info => info.driverId)
		.filter(isDefined)
		.flat()

	// LAN drivers can be automatically re-installed so we don't allow pruning them.
	// no ocean currents here :-)
	const defaultLANDrivers = (await command.client.drivers.listDefault())
		.filter(driver => driver.permissions?.find(permission => permission.name === 'lan'))
		.map(driver => driver.driverId)
	const prunableDrivers = installedDrivers
		.filter(driver => !inUseDriverIds.includes(driver.driverId))
		.filter(driver => !defaultLANDrivers.includes(driver.driverId))

	if (prunableDrivers.length === 0) {
		console.log('No unused drivers found.')
	} else {
		console.log(`Found ${prunableDrivers.length} unused drivers.`)
		const config: FormatAndWriteItemConfig<InstalledDriver> = {
			tableFieldDefinitions: [
				'driverId',
				'name',
				{ prop: 'description', skipEmpty: true },
				'version',
				'channelId',
				'developer',
				{ prop: 'vendorSupportInformation', skipEmpty: true },
			],
		}
		for (const prunableDriver of prunableDrivers) {
			console.log('\n\nFound unused driver:')
			await formatAndWriteItem(command, config, prunableDriver)
			const doUninstall = await booleanInput(`Uninstall ${prunableDriver.name} driver?`, { default: false })
			if (doUninstall) {
				await command.client.hubdevices.uninstallDriver(prunableDriver.driverId, hubId)
				console.log(`Driver ${prunableDriver.driverId} uninstalled from hub ${hubId}.`)
			} else {
				console.log(`Left driver ${prunableDriver.name} installed.`)
			}
		}
	}
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
