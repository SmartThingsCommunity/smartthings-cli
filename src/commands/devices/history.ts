import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type DeviceActivity } from '@smartthings/core-sdk'

import { buildEpilog } from '../../lib/help.js'
import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../../lib/command/api-command.js'
import { calculateOutputFormat, writeOutput } from '../../lib/command/output.js'
import {
	buildOutputFormatter,
	buildOutputFormatterBuilder,
	type BuildOutputFormatterFlags,
} from '../../lib/command/output-builder.js'
import { chooseDevice } from '../../lib/command/util/devices-choose.js'
import {
	calculateRequestLimit,
	getHistory,
	maxItemsPerRequest,
	toEpochTime,
	writeDeviceEventsTable,
} from '../../lib/command/util/history.js'
import { historyBuilder, type HistoryFlags } from '../../lib/command/util/history-builder.js'


export type CommandArgs =
	& APICommandFlags
	& BuildOutputFormatterFlags
	& HistoryFlags
	& {
		idOrIndex?: string
	}

const command = 'devices:history [id-or-index]'

const describe = 'get device history by device'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	historyBuilder(buildOutputFormatterBuilder(apiCommandBuilder(yargs)))
		.positional('id-or-index', { describe: 'the device id or number in list', type: 'string' })
		.example([
			['$0 devices:history', 'prompt for a device and display history for the chosen device'],
			['$0 devices:history 2', 'display history for device listed second in output of devices command'],
			['$0 devices:history 92f9920a-7629-40e3-8fdc-14924413897f', 'display history for device by id'],
		])
		.epilog(buildEpilog({ command }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const limit = argv.limit
	const perRequestLimit = calculateRequestLimit(limit)

	const deviceId = await chooseDevice(command, argv.idOrIndex, { allowIndex: true })
	const device = await command.client.devices.get(deviceId)
	const params = {
		deviceId,
		locationId: device.locationId,
		limit: perRequestLimit,
		before: toEpochTime(argv.before),
		after: toEpochTime(argv.after),
	}

	if (calculateOutputFormat(argv) === 'common') {
		if (limit > perRequestLimit) {
			console.log(`History is limited to ${maxItemsPerRequest} items per request.`)
		}
		const history = await command.client.history.devices(params)
		await writeDeviceEventsTable(command, history, { utcTimeFormat: argv.utc })
	} else {
		const items = await getHistory(command.client, limit, perRequestLimit, params)
		const outputFormatter = buildOutputFormatter<DeviceActivity[]>(argv, command.cliConfig)
		await writeOutput(outputFormatter(items), argv.output)
	}
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
