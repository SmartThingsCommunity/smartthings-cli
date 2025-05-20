import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type DevicePreference } from '@smartthings/core-sdk'

import { apiDocsURL } from '../../lib/command/api-command.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../lib/command/api-organization-command.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemFlags,
} from '../../lib/command/input-and-output-item.js'
import { chooseDevicePreference, tableFieldDefinitions } from '../../lib/command/util/devicepreferences-util.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& InputAndOutputItemFlags
	& {
		id?: string
	}

const command = 'devicepreferences:update [id]'

const describe = 'update a device preference'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiOrganizationCommandBuilder(yargs))
		.positional('id', { describe: 'device preference id', type: 'string' })
		.example([
			[
				'$0 devicepreferences:update --input dp.json',
				'select a device preference from a list and update it with data from dp.json',
			],
			[
				'$0 devicepreferences:update --input dp.yaml motionSensitivity',
				'update specified device preference with data from dp.yaml',
			],
		])
		.epilog(apiDocsURL('updatePreferenceById'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const id = await chooseDevicePreference(command, argv.id)
	await inputAndOutputItem<DevicePreference, DevicePreference>(
		command,
		{ tableFieldDefinitions },
		(_, devicePreference) => command.client.devicePreferences.update(id, devicePreference),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
