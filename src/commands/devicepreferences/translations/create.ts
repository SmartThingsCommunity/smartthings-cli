import { ArgumentsCamelCase, Argv, CommandModule } from 'yargs'

import { PreferenceLocalization } from '@smartthings/core-sdk'

import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../../lib/command/api-organization-command.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	InputAndOutputItemFlags,
} from '../../../lib/command/basic-io.js'
import { chooseDevicePreference } from '../../../lib/command/util/devicepreferences-util.js'
import {
	tableFieldDefinitions,
} from '../../../lib/command/util/devicepreferences/translations-util.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& InputAndOutputItemFlags
	& {
		devicePreferenceId?: string
	}

const command = 'devicepreferences:translations:create [device-preference-id]'

const describe = 'create a translation for a device preference'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiOrganizationCommandBuilder(yargs))
		.positional('device-preference-id', { describe: 'device preference id', type: 'string' })
		.example([
			[
				'$0 devicepreferences:translations:create -i preferenceTranslation.json',
				'create a translation as defined in preferenceTranslation.json',
			],
		])

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const preferenceId = await chooseDevicePreference(command, argv.devicePreferenceId)

	await inputAndOutputItem<PreferenceLocalization, PreferenceLocalization>(
		command,
		{ tableFieldDefinitions },
		(_, translation) =>
			command.client.devicePreferences.createTranslations(preferenceId, translation),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
