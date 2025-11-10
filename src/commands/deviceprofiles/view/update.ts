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
import { type ActionFunction } from '../../../lib/command/io-defs.js'
import { chooseDeviceProfile } from '../../../lib/command/util/deviceprofiles-choose.js'
import { generateDefaultConfig } from '../../../lib/command/util/deviceprofiles-create.js'
import {
	buildTableOutput,
	cleanupForUpdate,
	type DeviceDefinition,
	type DeviceDefinitionRequest,
} from '../../../lib/command/util/deviceprofiles-util.js'
import { augmentPresentation, prunePresentation } from '../../../lib/command/util/deviceprofiles-view.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& InputAndOutputItemFlags
	& {
		id?: string
	}

const command = 'deviceprofiles:view:update [id]'

const describe = 'update a device profile and its device configuration'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiOrganizationCommandBuilder(yargs))
		.positional('id', { describe: 'device profile id', type: 'string' })
		.example([
			[
				'$0 deviceprofiles:view:update --input test.yaml',
				'prompt for a device profile and update it and its device configuration as defined in test.yaml',
			],
			[
				'$0 deviceprofiles:view:update 84042863-0d34-4c5c-b497-808daf230787 --input test.json',
				'update the specified device profile and its device configuration as defined in test.json',
			],
		])
		.epilog(buildEpilog({
			command,
			formattedNotes:
				'  Updates a device profile and device configuration and sets the vid of the profile ' +
				'to the vid of the updated configuration. Unlike deviceprofiles:update this ' +
				'command accepts a consolidated object that can include a device configuration ' +
				'in a property named "view".\n\n' +
				'  This sample file adds the powerMeter capability to the device and makes it available in' +
				'the device detail view but not the rule builder:\n\n' +
				'  components:\n' +
				'    - id: main\n' +
				'      capabilities:\n' +
				'        - id: switch\n' +
				'        - id: powerMeter\n' +
				'  view:\n' +
				'    dashboard:\n' +
				'      states:\n' +
				'        - capability: switch\n' +
				'      actions:\n' +
				'        - capability: switch\n' +
				'    detailView:\n' +
				'      - capability: switch\n' +
				'      - capability: powerMeter\n' +
				'    automation:\n' +
				'      conditions:\n' +
				'        - capability: switch',
			apiDocs: ['createDeviceConfiguration', 'updateDeviceProfile', 'generateDeviceConfig'],
		}))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const id = await chooseDeviceProfile(command, argv.id)
	const executeUpdate: ActionFunction<void, DeviceDefinitionRequest, DeviceDefinition> = async (_, data) => {
		const profileData = { ...data }
		delete profileData.view

		const presentationData = data.view
			? augmentPresentation(data.view)
			: await generateDefaultConfig(command.client, id, profileData)

		const presentation = await command.client.presentation.create(presentationData)
		if (!profileData.metadata) {
			profileData.metadata = {}
		}
		profileData.metadata.vid = presentation.presentationId
		profileData.metadata.mnmn = presentation.manufacturerName
		const profile = await command.client.deviceProfiles.update(id, cleanupForUpdate(profileData))

		return { ...profile, presentation: prunePresentation(presentation) }
	}
	await inputAndOutputItem(
		command,
		{ buildTableOutput: data => buildTableOutput(command.tableGenerator, data, { includeViewInfo: true }) },
		executeUpdate,
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
