import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type DeviceProfile } from '@smartthings/core-sdk'

import { buildEpilog } from '../../lib/help.js'
import { fatalError } from '../../lib/util.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../lib/command/api-organization-command.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemFlags,
} from '../../lib/command/input-and-output-item.js'
import { type ActionFunction } from '../../lib/command/io-defs.js'
import {
	buildTableOutput,
	cleanupForUpdate,
	type DeviceDefinitionRequest,
} from '../../lib/command/util/deviceprofiles-util.js'
import { chooseDeviceProfile } from '../../lib/command/util/deviceprofiles-choose.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& InputAndOutputItemFlags
	& {
		idOrIndex?: string
	}

const command = 'deviceprofiles:update [id-or-index]'

const describe = 'update a device profile'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiOrganizationCommandBuilder(yargs))
		.positional('id-or-index', { describe: 'device profile id or number from list', type: 'string' })
		.example([
			[
				'$0 deviceprofiles:update --input my-profile.yaml',
				'prompt for a device profile and update it using the data in my-profile.yaml',
			],
			[
				'$0 deviceprofiles:update --input my-profile.json 204cf401-bb4b-4dfc-91ec-729f5d8075ef',
				'update the specified device profile using the data in my-profile.json',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'updateDeviceProfile' }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const id = await chooseDeviceProfile(command, argv.idOrIndex)
	const executeUpdate: ActionFunction<void, DeviceDefinitionRequest, DeviceProfile> = async (_, data) => {
		if (data.view) {
			return fatalError('Input contains "view" property. Use deviceprofiles:view:update instead.')
		}

		return command.client.deviceProfiles.update(id, cleanupForUpdate(data))
	}
	await inputAndOutputItem(
		command,
		{ buildTableOutput: data => buildTableOutput(command.tableGenerator, data, { includePreferences: true }) },
		executeUpdate,
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
