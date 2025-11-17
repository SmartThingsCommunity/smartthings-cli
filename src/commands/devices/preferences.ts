import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type DevicePreferenceResponse } from '@smartthings/core-sdk'

import { buildEpilog } from '../../lib/help.js'
import { type APICommandFlags, apiCommand, apiCommandBuilder } from '../../lib/command/api-command.js'
import { chooseDevice } from '../../lib/command/util/devices-choose.js'
import { type FormatAndWriteItemFlags, formatAndWriteItem, formatAndWriteItemBuilder } from '../../lib/command/format.js'
import { type TableGenerator } from '../../lib/table-generator.js'


export type CommandArgs = APICommandFlags & FormatAndWriteItemFlags & {
	idOrIndex?: string
}

const command = 'devices:preferences [id-or-index]'

const describe = 'get the current preferences of a device'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	formatAndWriteItemBuilder(apiCommandBuilder(yargs))
		.positional('id-or-index', { describe: 'the device id or number in list', type: 'string' })
		.example([
			['$0 devices:preferences', 'prompt for a device and display preferences for the chosen device'],
			['$0 devices:preferences 2', 'display preferences for device listed second in output of devices command'],
			['$0 devices:preferences 92f9920a-7629-40e3-8fdc-14924413897f', 'display preferences for device by id'],
		])
		.epilog(buildEpilog({ command }))

export const buildTableOutput = (tableGenerator: TableGenerator, data: DevicePreferenceResponse): string => {
	let output = ''
	if (data.values) {
		const table = tableGenerator.newOutputTable({ head: ['Name', 'Type', 'Value'] })
		const names = Object.keys(data.values).sort()
		for (const name of names) {
			const item = data.values[name]
			if (item) {
				table.push([
					name,
					item.preferenceType,
					item.value,
				])
			}
		}
		output = table.toString()
	}
	return output
}

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const deviceId = await chooseDevice(command, argv.idOrIndex, { allowIndex: true })
	const preferences = await command.client.devices.getPreferences(deviceId)
	await formatAndWriteItem(
		command,
		{ buildTableOutput: data => buildTableOutput(command.tableGenerator, data) },
		preferences,
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
