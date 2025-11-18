import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type CapabilityLocalization } from '@smartthings/core-sdk'

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
import { capabilityIdBuilder, type CapabilityIdInputFlags } from '../../../lib/command/capability-flags.js'
import { chooseCapability } from '../../../lib/command/util/capabilities-choose.js'
import { buildTableOutput } from '../../../lib/command/util/capabilities-translations-table.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& CapabilityIdInputFlags
	& InputAndOutputItemFlags

const command = 'capabilities:translations:update [id]'

const describe = 'update a capability translation'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(capabilityIdBuilder(apiOrganizationCommandBuilder(yargs)))
		.example([
			[
				'$0 capabilities:translations:update -i es.json',
				'prompt for a capability and update the translation defined in es.json on it',
			],
			[
				'$0 capabilities:translations:update cathappy12345.myCapability -i sw.yaml',
				'update the translation defined in sw.yaml for the "cathappy12345.myCapability" capability',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'updateCapabilityLocalization' }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const id = await chooseCapability(command, argv.id, argv.capabilityVersion)
	await inputAndOutputItem<CapabilityLocalization, CapabilityLocalization>(
		command,
		{ buildTableOutput: data => buildTableOutput(command.tableGenerator, data) },
		(_, translations) => command.client.capabilities.updateTranslations(id.id, id.version, translations),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
