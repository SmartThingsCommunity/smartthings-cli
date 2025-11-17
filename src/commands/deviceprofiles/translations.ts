import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type DeviceProfileTranslations, type LocaleReference } from '@smartthings/core-sdk'

import { buildEpilog } from '../../lib/help.js'
import { fatalError } from '../../lib/util.js'
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
import { chooseDeviceProfileFn } from '../../lib/command/util/deviceprofiles-choose.js'
import { buildTableOutput } from '../../lib/command/util/deviceprofiles-translations-table.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& OutputItemOrListFlags
	& {
		profileIdOrIndex?: string
		tag?: string
		verbose: boolean
	}

const command = 'deviceprofiles:translations [profileIdOrIndex] [tag]'

const describe = 'list locales translated for a device profile or display translations for a specific locale'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemOrListBuilder(apiOrganizationCommandBuilder(yargs))
		.positional(
			'profile-id-or-index',
			{ describe: 'device profile id or number from list', type: 'string' },
		)
		.positional('tag', { describe: 'the locale tag or number from list', type: 'string' })
		.option('verbose',
			{ alias: 'v', describe: 'include list of locales in table output', type: 'boolean', default: false })
		.example([
			[
				'$0 deviceprofiles:translations',
				'prompt for a device profile and list its locales',
			],
			[
				'$0 deviceprofiles:translations --verbose',
				'include locales with profiles when prompting for a device profile',
			],
			[
				'$0 deviceprofiles:translations 3acbf2fc-6be2-4be0-aeb5-c10f4ff357bb',
				'list locales for a specific device profile id',
			],
			[
				'$0 deviceprofiles:translations 2',
				'list locales for the device profile displayed when running "smartthings deviceprofiles:translations"',
			],
			[
				'$0 deviceprofiles:translations 3acbf2fc-6be2-4be0-aeb5-44759cbd66c2 sw',
				'display translations for the specified device profile id and locale',
			],
		])
		.epilog(buildEpilog({ command }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const deviceProfileId = await chooseDeviceProfileFn({ verbose: argv.verbose })(
		command,
		argv.profileIdOrIndex,
		{ allowIndex: true },
	)

	const config: OutputItemOrListConfig<DeviceProfileTranslations, LocaleReference> = {
		primaryKeyName: 'tag',
		sortKeyName: 'tag',
		buildTableOutput: data => buildTableOutput(command.tableGenerator, data),
		listTableFieldDefinitions: ['tag'],
	}
	await outputItemOrList<DeviceProfileTranslations, LocaleReference>(
		command,
		config,
		argv.tag,
		async () => await command.client.deviceProfiles.listLocales(deviceProfileId).catch(error => {
			if (error.response?.status === 404) {
				return []
			}
			throw error
		}),
		async tag => await command.client.deviceProfiles.getTranslations(deviceProfileId, tag).catch(error => {
			if (error.response?.status === 404) {
				return fatalError(`No ${tag} translation exists for device profile ${deviceProfileId}.`)
			}
			throw error
		}),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
