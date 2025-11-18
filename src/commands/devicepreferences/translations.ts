import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type LocaleReference, type PreferenceLocalization } from '@smartthings/core-sdk'

import { buildEpilog } from '../../lib/help.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../lib/command/api-organization-command.js'
import {
	outputItemOrList,
	outputItemOrListBuilder,
	type OutputItemOrListConfig,
	type OutputItemOrListFlags,
} from '../../lib/command/listing-io.js'
import { chooseDevicePreference } from '../../lib/command/util/devicepreferences-util.js'
import { tableFieldDefinitions } from '../../lib/command/util/devicepreferences/translations-util.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& OutputItemOrListFlags
	& {
		preferenceIdOrIndex?: string
		tag?: string
	}

const command = 'devicepreferences:translations [preferenceIdOrIndex] [tag]'

const describe = 'list locales translated for a device preference or display translations for a specific locale'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemOrListBuilder(apiOrganizationCommandBuilder(yargs))
		.positional(
			'preference-id-or-index',
			{ describe: 'device preference id or number from list', type: 'string' },
		)
		.positional('tag', { describe: 'the locale tag', type: 'string' })
		.example([
			[
				'$0 devicepreferences:translations',
				'prompt for a device preference and list its locales',
			],
			[
				'$0 devicepreferences:translations motionSensitivity',
				'list locales for a specific device preference id',
			],
			[
				'$0 devicepreferences:translations motionSensitivity ko',
				'display translations for the specified device preference id and locale',
			],
		])
		.epilog(buildEpilog({ command }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const preferenceId = await chooseDevicePreference(command, argv.preferenceIdOrIndex)

	const config: OutputItemOrListConfig<PreferenceLocalization, LocaleReference> = {
		primaryKeyName: 'tag',
		sortKeyName: 'tag',
		listTableFieldDefinitions: ['tag'],
		tableFieldDefinitions,
	}

	await outputItemOrList<PreferenceLocalization, LocaleReference>(
		command,
		config,
		argv.tag,
		() => command.client.devicePreferences.listTranslations(preferenceId),
		tag => command.client.devicePreferences.getTranslations(preferenceId, tag),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
