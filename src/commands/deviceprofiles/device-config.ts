import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { buildEpilog } from '../../lib/help.js'
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
import { buildTableOutput } from '../../lib/command/util/presentation-device-config-table.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& FormatAndWriteItemFlags
	& {
		idOrIndex?: string
	}

const command = 'deviceprofiles:device-config [id-or-index]'

const describe = 'get the device configuration associated with a device profile'

export const builder = (yargs: Argv): Argv<CommandArgs> =>
	formatAndWriteItemBuilder(apiOrganizationCommandBuilder(yargs))
		.positional('id-or-index', { describe: 'device profile id or number from list', type: 'string' })
		.example([
			[
				'$0 deviceprofiles:device-config',
				'prompt for a device profile and display its device config',
			],
			[
				'$0 deviceprofiles:device-config 2',
				'display device config for the second device profile listed when running' +
				' "smartthings deviceprofiles"',
			],
			[
				'$0 deviceprofiles:device-config c4cb671a-c538-45fa-b076-24b2616181de',
				'display device config for the specified device profile',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: ['getDeviceProfile', 'getDeviceConfiguration'] }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const id = await chooseDeviceProfile(command, argv.idOrIndex, { allowIndex: true })

	const profile = await command.client.deviceProfiles.get(id)
	if (!profile.metadata) {
		return fatalError('No presentation defined for device profile')
	}
	const deviceConfig = await command.client.presentation.get(profile.metadata.vid, profile.metadata.mnmn)
	await formatAndWriteItem(
		command,
		{ buildTableOutput: data => buildTableOutput(command.tableGenerator, data) },
		deviceConfig,
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
