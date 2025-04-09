import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type DeviceActivity } from '@smartthings/core-sdk'

import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../../lib/command/api-command.js'
import { calculateOutputFormat, writeOutput } from '../../lib/command/output.js'
import {
	buildOutputFormatter,
	buildOutputFormatterBuilder,
	type BuildOutputFormatterFlags,
} from '../../lib/command/output-builder.js'
import {
	calculateRequestLimit,
	getHistory,
	maxItemsPerRequest,
	toEpochTime,
	writeDeviceEventsTable,
} from '../../lib/command/util/history.js'
import { chooseLocation } from '../../lib/command/util/locations-util.js'
import { historyBuilder, type HistoryFlags } from '../../lib/command/util/history-builder.js'


export type CommandArgs =
	& APICommandFlags
	& BuildOutputFormatterFlags
	& HistoryFlags
	& {
		idOrIndex?: string
	}

const command = 'locations:history [id-or-index]'

const describe = 'get history by location'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	historyBuilder(buildOutputFormatterBuilder(apiCommandBuilder(yargs)))
		.positional('id-or-index', { describe: 'the location id or number in list', type: 'string' })
		.example([
			['$0 locations:history', 'prompt for a location and display history for it'],
			['$0 locations:history 2', 'display history for location listed second in output of locations command'],
			['$0 locations:history 92f9920a-7629-40e3-8fdc-14924413897f', 'display history for location by id'],
		])

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const limit = argv.limit
	const perRequestLimit = calculateRequestLimit(limit)

	const id = await chooseLocation(command, argv.idOrIndex, { autoChoose: true, allowIndex: true })
	const params = {
		locationId: id,
		limit: perRequestLimit,
		before: toEpochTime(argv.before),
		after: toEpochTime(argv.after),
	}

	if (calculateOutputFormat(argv) === 'common') {
		if (limit > perRequestLimit) {
			console.log(`History is limited to ${maxItemsPerRequest} items per request.`)
		}
		const history = await command.client.history.devices(params)
		await writeDeviceEventsTable(command, history, { includeName: true, utcTimeFormat: argv.utc })
	} else {
		const items = await getHistory(command.client, limit, perRequestLimit, params)
		const outputFormatter = buildOutputFormatter<DeviceActivity[]>(argv, command.cliConfig)
		await writeOutput(outputFormatter(items), argv.output)
	}
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
