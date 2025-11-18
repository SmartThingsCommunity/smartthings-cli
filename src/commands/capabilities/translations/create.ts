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
import { chooseCapability } from '../../../lib/command/util/capabilities-choose.js'
import { buildTableOutput } from '../../../lib/command/util/capabilities-translations-table.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& InputAndOutputItemFlags
	& CapabilityIdInputFlags

const command = 'capabilities:translations:create [id]'

const describe = 'create a capability translation'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(capabilityIdBuilder(apiOrganizationCommandBuilder(yargs)))
		.example([
			[
				'$0 capabilities:translations:create custom1.outputModulation -i en.yaml',
				'create a translation for the capability "custom1.outputModulation" from the definition in "en.yaml"',
			],
			[
				'$0 capabilities:translations:create -i en.yaml',
				'prompt for a capability and add the translation from "en.yaml" to it',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'createCapabilityLocalization' }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const id = await chooseCapability(command, argv.id, argv.capabilityVersion)
	await inputAndOutputItem<CapabilityLocalization, CapabilityLocalization>(command,
		{ buildTableOutput: data => buildTableOutput(command.tableGenerator, data) },
		(_, translations) => command.client.capabilities.createTranslations(id.id, id.version, translations))
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
