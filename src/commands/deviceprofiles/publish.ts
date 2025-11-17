import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { DeviceProfileStatus } from '@smartthings/core-sdk'

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
import { buildTableOutput } from '../../lib/command/util/deviceprofiles-util.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& FormatAndWriteItemFlags
	& {
		id?: string
	}

const command = 'deviceprofiles:publish [id]'

const describe = 'publish a device profile (published profiles cannot be modified)'

export const builder = (yargs: Argv): Argv<CommandArgs> =>
	formatAndWriteItemBuilder(apiOrganizationCommandBuilder(yargs))
		.positional('id', { describe: 'device profile id', type: 'string' })
		.example([
			[
				'$0 deviceprofiles:publish',
				'prompt for a device profile and publish it',
			],
			[
				'$0 deviceprofiles:publish aaddcbec-e8ce-4227-b9b2-f4f22f87f2ec',
				'publish the specified device profile',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: ['getDeviceProfile', 'getDeviceConfiguration'] }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const id = await chooseDeviceProfile(command, argv.id)

	const deviceProfile = await command.client.deviceProfiles.updateStatus(id, DeviceProfileStatus.PUBLISHED)
	await formatAndWriteItem(command, { buildTableOutput: data => buildTableOutput(command.tableGenerator, data) }, deviceProfile)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
