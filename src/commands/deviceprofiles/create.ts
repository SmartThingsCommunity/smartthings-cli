import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type DeviceProfile } from '@smartthings/core-sdk'

import { apiDocsURL } from '../../lib/command/api-command.js'
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
import { userInputProcessor } from '../../lib/command/input-processor.js'
import { createWithDefaultConfig, getInputFromUser } from '../../lib/command/util/deviceprofiles-create.js'
import {
	buildTableOutput,
	cleanupForCreate,
	type DeviceDefinitionRequest,
} from '../../lib/command/util/deviceprofiles-util.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& InputAndOutputItemFlags
	& {
		namespace?: string
	}

const command = 'deviceprofiles:create'

const describe = 'create a new device profile'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiOrganizationCommandBuilder(yargs))
		.example([
			['$0 deviceprofiles:create', 'create a device profile from prompted input'],
			['$0 deviceprofiles:create --dry-run', 'build JSON for a device profile from prompted input'],
			['$0 deviceprofiles:create -i my-profile.yaml', 'create a device profile defined in "my-profile.yaml'],
		])
		.epilog('Creates a new device profile. If a vid field is not present in the metadata ' +
			'then a default device presentation will be created for this profile and the ' +
			'vid set to reference it.\n\n' +
			apiDocsURL('createDeviceProfile'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const createDeviceProfile = async (_: void, data: DeviceDefinitionRequest): Promise<DeviceProfile> => {
		if (data.view) {
			throw new Error('Input contains "view" property. Use deviceprofiles:view:create instead.')
		}

		if (!data.metadata?.vid) {
			const profileAndConfig = await createWithDefaultConfig(command.client, data)
			return profileAndConfig.deviceProfile
		}

		return await command.client.deviceProfiles.create(cleanupForCreate(data))
	}
	await inputAndOutputItem(
		command,
		{ buildTableOutput: data => buildTableOutput(command.tableGenerator, data) },
		createDeviceProfile, userInputProcessor(() => getInputFromUser(command)),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
