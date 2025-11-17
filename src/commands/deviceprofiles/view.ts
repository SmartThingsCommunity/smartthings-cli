import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { buildEpilog } from '../../lib/help.js'
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
import { buildTableOutput, type DeviceDefinition } from '../../lib/command/util/deviceprofiles-util.js'
import { prunePresentation } from '../../lib/command/util/deviceprofiles-view.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& FormatAndWriteItemFlags
	& {
		idOrIndex?: string
	}

const command = 'deviceprofiles:view [id-or-index]'

const describe = 'show device profile and device configuration in a single, consolidated view'

export const builder = (yargs: Argv): Argv<CommandArgs> =>
	formatAndWriteItemBuilder(apiOrganizationCommandBuilder(yargs))
		.positional('id-or-index', { describe: 'device profile id or number from list', type: 'string' })
		.example([
			[
				'$0 deviceprofiles:view',
				'prompt for a device profile and display configuration info for it',
			],
			[
				'$0 deviceprofiles:view 3',
				'display configuration info for the third device profile in the list retrieved by ' +
					' running "smartthings deviceprofiles"',
			],
			[
				'$0 deviceprofiles:view aaddcbec-e8ce-4227-b9b2-f4f22f87f2ec',
				'display configuration info for a device profile by id',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: ['getDeviceProfile', 'getDeviceConfiguration'] }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const getDeviceProfileAndConfig = async (id: string): Promise<DeviceDefinition> => {
		const profile = await command.client.deviceProfiles.get(id)
		if (profile.metadata) {
			try {
				const view = await command.client.presentation.get(profile.metadata.vid, profile.metadata.mnmn)
				return { ...profile, view: prunePresentation(view) }
			} catch (error) {
				command.logger.warn(error)
				return profile
			}
		}
		return profile
	}

	const profileId = await chooseDeviceProfile(command, argv.idOrIndex, { allowIndex: true })
	const profileAndConfig = await getDeviceProfileAndConfig(profileId)
	await formatAndWriteItem(
		command,
		{ buildTableOutput: data => buildTableOutput(command.tableGenerator, data) },
		profileAndConfig,
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
