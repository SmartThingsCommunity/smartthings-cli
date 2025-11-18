import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type PreferenceLocalization } from '@smartthings/core-sdk'

import { buildEpilog } from '../../../lib/help.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../../lib/command/api-organization-command.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemFlags,
} from '../../../lib/command/input-and-output-item.js'
import { chooseDevicePreference } from '../../../lib/command/util/devicepreferences-util.js'
import { tableFieldDefinitions } from '../../../lib/command/util/devicepreferences/translations-util.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& InputAndOutputItemFlags
	& {
		id?: string
	}

const command = 'devicepreferences:translations:update [id]'

const describe = 'update a device preference translation'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiOrganizationCommandBuilder(yargs))
		.positional('id', { describe: 'device preference id', type: 'string' })
		.example([
			[
				'$0 devicepreferences:translations:update -i en.json',
				'prompt for a device preference and update the translation defined in en.json on it',
			],
			[
				'$0 devicepreferences:translations:update cathappy12345.myPreference -i en.yaml',
				'update the translation defined in en.yaml for the "cathappy12345.myPreference" device preference',
			],
		])
		.epilog(buildEpilog({ command }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const preferenceId = await chooseDevicePreference(command, argv.id)

	await inputAndOutputItem<PreferenceLocalization, PreferenceLocalization>(
		command,
		{ tableFieldDefinitions },
		(_, translation) => command.client.devicePreferences.updateTranslations(preferenceId, translation),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
