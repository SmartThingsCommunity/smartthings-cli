import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { buildEpilog } from '../../../lib/help.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../../lib/command/api-organization-command.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemFlags,
} from '../../../lib/command/input-and-output-item.js'
import { createWithDefaultConfig } from '../../../lib/command/util/deviceprofiles-create.js'
import {
	buildTableOutput,
	cleanupForCreate,
	type DeviceDefinition,
	type DeviceDefinitionRequest,
} from '../../../lib/command/util/deviceprofiles-util.js'
import {
	prunePresentation,
	augmentPresentation,
} from '../../../lib/command/util/deviceprofiles-view.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& InputAndOutputItemFlags

const command = 'deviceprofiles:view:create'

const describe = 'create a new device profile and device configuration'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiOrganizationCommandBuilder(yargs))
		.example([
			[
				'$0 deviceprofiles:view:create -i view.yaml',
				'create a device profile and device configuration as defined in view.yaml',
			],
		])
		.epilog(buildEpilog({
			command,
			formattedNotes: 'Creates a new device profile and device configuration. Unlike deviceprofiles:create, ' +
				'this command accepts a consolidated object that can include a device configuration ' +
				'in a property named "view".\n\n' +
				'A simple example, written in YAML:\n\n' +
				'name: Test Switch\n' +
				'components:\n' +
				'  - id: main\n' +
				'    capabilities:\n' +
				'      - id: switch\n' +
				'view:\n' +
				'  dashboard:\n' +
				'    states:\n' +
				'      - capability: switch\n' +
				'    actions:\n' +
				'      - capability: switch\n' +
				'  detailView:\n' +
				'    - capability: switch\n' +
				'  automation:\n' +
				'    conditions:\n' +
				'      - capability: switch',
			apiDocs: ['createDeviceProfile', 'createDeviceConfiguration', 'updateDeviceProfile', 'generateDeviceConfig'],
		}))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const createWithCustomConfig = async (data: DeviceDefinitionRequest): Promise<DeviceDefinition> => {
		if (!data.view) {
			throw Error('View property not defined')
		}

		// create the device config from the view data
		const deviceConfig = await command.client.presentation.create(augmentPresentation(data.view))

		// Set the vid and mnmn from the config
		if (!data.metadata) {
			data.metadata = {}
		}
		data.metadata.vid = deviceConfig.presentationId
		data.metadata.mnmn = deviceConfig.manufacturerName
		delete data.view

		// Create the profile
		const profile = await command.client.deviceProfiles.create(cleanupForCreate(data))

		// Return the composite object
		return { ...profile, view: prunePresentation(deviceConfig) }
	}

	const createDeviceDefinition = async (_: void, data: DeviceDefinitionRequest): Promise<DeviceDefinition> => {
		if (data.view) {
			return createWithCustomConfig(data)
		}
		const profileAndConfig = await createWithDefaultConfig(command.client, data)
		return { ...profileAndConfig.deviceProfile, view: prunePresentation(profileAndConfig.deviceConfig) }
	}
	await inputAndOutputItem(
		command,
		{ buildTableOutput: data => buildTableOutput(command.tableGenerator, data, { includeViewInfo: true }) },
		createDeviceDefinition,
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
