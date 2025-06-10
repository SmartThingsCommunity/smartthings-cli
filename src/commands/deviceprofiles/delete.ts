import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { apiDocsURL } from '../../lib/command/api-command.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../lib/command/api-organization-command.js'
import { chooseDeviceProfile } from '../../lib/command/util/deviceprofiles-choose.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& {
		id?: string
	}

const command = 'deviceprofiles:delete [id]'

const describe = 'delete a device profile'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiOrganizationCommandBuilder(yargs)
		.positional('id', { describe: 'device profile id', type: 'string' })
		.example([
			['$0 deviceprofiles:delete', 'prompt for a device profile and delete it'],
			[
				'$0 deviceprofiles:delete 63b8c91e-9686-4c43-9afb-fbd9f77e3bb0',
				'delete the device profile with the specified id',
			],
		])
		.epilog(apiDocsURL('deleteDeviceProfile'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const id = await chooseDeviceProfile(command, argv.id)
	await command.client.deviceProfiles.delete(id)
	console.log(`Device profile ${id} deleted.`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
