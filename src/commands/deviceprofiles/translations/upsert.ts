import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type DeviceProfileTranslations } from '@smartthings/core-sdk'

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
import { chooseDeviceProfile } from '../../../lib/command/util/deviceprofiles-choose.js'
import { buildTableOutput } from '../../../lib/command/util/deviceprofiles-translations-table.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& InputAndOutputItemFlags
	& {
		id?: string
	}

const command = 'deviceprofiles:translations:upsert [id]'

const describe = 'create or update a device profile translation'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiOrganizationCommandBuilder(yargs))
		.positional('id', { describe: 'device profile id', type: 'string' })
		.example([
			[
				'$0 deviceprofiles:translations:upsert --input de.yaml',
				'select a device profile from a list and update the translation specified in de.yaml',
			],
			[
				'$0 deviceprofiles:translations:upsert 3acbf2fc-6be2-4be0-aeb5-44759cbd66c2 --input fr.json',
				'update the translation specified in fr.json on the specified device profile',
			],
		])
		.epilog(buildEpilog({ command }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const id = await chooseDeviceProfile(command, argv.id)

	await inputAndOutputItem<DeviceProfileTranslations, DeviceProfileTranslations>(
		command,
		{ buildTableOutput: data => buildTableOutput(command.tableGenerator, data) },
		async (_, data) => command.client.deviceProfiles.upsertTranslations(id, data),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
