import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type LocaleReference } from '@smartthings/core-sdk'

import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../../lib/command/api-organization-command.js'
import { selectFromList, type SelectFromListConfig } from '../../../lib/command/select.js'
import { chooseDeviceProfile } from '../../../lib/command/util/deviceprofiles-choose.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& {
		id?: string
		tag?: string
	}

const command = 'deviceprofiles:translations:delete [id] [tag]'

const describe = 'delete a device profile translation'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiOrganizationCommandBuilder(yargs)
		.positional('id', { describe: 'device profile id', type: 'string' })
		.positional('tag', { describe: 'the locale tag', type: 'string' })
		.example([
			[
				'$0 deviceprofiles:translations:delete',
				'prompt for a device profile and locale to delete',
			],
			[
				'$0 deviceprofiles:translations:delete 3acbf2fc-6be2-4be0-aeb5-c10f4ff357bb',
				'prompt for a locale to delete from the specified device profile',
			],
			[
				'$0 deviceprofiles:translations:delete 3acbf2fc-6be2-4be0-aeb5-44759cbd66c2 en',
				'delete the specified locale on the specified device profile',
			],
		])

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const deviceProfileId = await chooseDeviceProfile(command, argv.id)

	const localeTagSelectConfig: SelectFromListConfig<LocaleReference> = {
		primaryKeyName: 'tag',
		sortKeyName: 'tag',
		listTableFieldDefinitions: ['tag'],
	}
	const localeTag = await selectFromList(command, localeTagSelectConfig, {
		preselectedId: argv.tag,
		listItems: () => command.client.deviceProfiles.listLocales(deviceProfileId),
		promptMessage: 'Select a locale:',
	})

	await command.client.deviceProfiles.deleteTranslations(deviceProfileId, localeTag)
	console.log(`Translation ${localeTag} deleted from device profile ${deviceProfileId}.`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
