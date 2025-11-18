import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type CapabilityLocalization } from '@smartthings/core-sdk'

import { buildEpilog } from '../../../lib/help.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../../lib/command/api-organization-command.js'
import { capabilityIdBuilder, type CapabilityIdInputFlags } from '../../../lib/command/capability-flags.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemFlags,
} from '../../../lib/command/input-and-output-item.js'
import { buildTableOutput } from '../../../lib/command/util/capabilities-translations-table.js'
import { chooseCapability } from '../../../lib/command/util/capabilities-choose.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& CapabilityIdInputFlags
	& InputAndOutputItemFlags

const command = 'capabilities:translations:upsert [id]'

const describe = 'create or update a capability translation'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(capabilityIdBuilder(apiOrganizationCommandBuilder(yargs)))
		.example([
			[
				'$0 capabilities:translations:upsert -i en.json',
				'prompt for a capability and create or update the translation for it defined in en.json',
			],
			[
				'$0 capabilities:translations:upsert custom1.outputModulation -i en.yaml',
				'create or update the translation defined in en.yaml on the "custom1.outputModulation" capability',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: ['updateCapabilityLocalization', 'createCapabilityLocalization'] }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const id = await chooseCapability(command, argv.id, argv.capabilityVersion)
	await inputAndOutputItem<CapabilityLocalization, CapabilityLocalization>(
		command,
		{ buildTableOutput: data => buildTableOutput(command.tableGenerator, data) },
		(_, translations) => command.client.capabilities.upsertTranslations(id.id, id.version, translations),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
