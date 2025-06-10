import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { apiDocsURL } from '../../lib/command/api-command.js'
import { fatalError } from '../../lib/util.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../lib/command/api-organization-command.js'
import {
	formatAndWriteItem,
	formatAndWriteItemBuilder,
	type FormatAndWriteItemFlags,
} from '../../lib/command/format.js'
import { chooseDeviceProfile } from '../../lib/command/util/deviceprofiles-choose.js'
import { buildTableOutput } from '../../lib/command/util/presentation-table.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& FormatAndWriteItemFlags
	& {
		idOrIndex?: string
	}

const command = 'deviceprofiles:presentation [id-or-index]'

const describe = 'get the presentation associated with a device profile'

export const builder = (yargs: Argv): Argv<CommandArgs> =>
	formatAndWriteItemBuilder(apiOrganizationCommandBuilder(yargs))
		.positional('id-or-index', { describe: 'device profile id or number from list', type: 'string' })
		.example([
			[
				'$0 deviceprofiles:presentation',
				'prompt for a device profile and display its presentation information',
			],
			[
				'$0 deviceprofiles:presentation 2',
				'display presentation information for the second device profile listed when running' +
					' "smartthings deviceprofiles"',
			],
			[
				'$0 deviceprofiles:presentation fd4adb7f-4a23-4134-9b39-05ed889a03cf',
				'display presentation information for the specified device profile',
			],
			[
				'$0 deviceprofiles:presentation fd4adb7f-4a23-4134-9b39-05ed889a03cf --language ko',
				'display presentation information for the specified device profile and language',
			],
		])
		.epilog('Specifying only the presentationId defaults to the language set for the' +
			' computer\'s operating system. The language can be overridden by specifying an ISO' +
			' language code. If "NONE" is specified for the language' +
			'flag then no language header is specified in the API request\n\n' +
			apiDocsURL('getDeviceProfile', 'getDevicePresentation'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const id = await chooseDeviceProfile(command, argv.idOrIndex, { allowIndex: true })

	const profile = await command.client.deviceProfiles.get(id)
	if (!profile.metadata) {
		return fatalError('No presentation defined for device profile')
	}

	const presentation = await command.client.presentation.getPresentation(profile.metadata.vid, profile.metadata.mnmn)
	await formatAndWriteItem(
		command,
		{ buildTableOutput: data => buildTableOutput(command.tableGenerator, data) },
		presentation,
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
