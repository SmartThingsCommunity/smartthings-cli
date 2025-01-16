import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type CapabilityPresentationCreate, type CapabilityPresentation } from '@smartthings/core-sdk'

import { apiDocsURL } from '../../../lib/command/api-command.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../../lib/command/api-organization-command.js'
import { capabilityIdBuilder, type CapabilityIdInputFlags } from '../../../lib/command/capability-flags.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	InputAndOutputItemFlags,
} from '../../../lib/command/input-and-output-item.js'
import { chooseCapability } from '../../../lib/command/util/capabilities-choose.js'
import { buildTableOutput } from '../../../lib/command/util/capabilities-presentation-table.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& CapabilityIdInputFlags
	& InputAndOutputItemFlags

const command = 'capabilities:presentation:create [id]'

const describe = 'create presentation model for a capability'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(capabilityIdBuilder(apiOrganizationCommandBuilder(yargs)))
		.example([
			[
				'$0 capabilities:presentation:create -i presentation.json',
				'prompt for a capability and create a presentation for it defined in presentation.json',
			],
			[
				'$0 capabilities:presentation:create -i presentation.json cathappy12345.myCapability',
				'create a presentation for cathappy12345.myCapability defined in presentation.json',
			],
		])
		.epilog(apiDocsURL('createCustomCapabilityPresentation'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const id = await chooseCapability(command, argv.id, argv.capabilityVersion)
	await inputAndOutputItem(
		command,
		{ buildTableOutput: (data: CapabilityPresentation) => buildTableOutput(command.tableGenerator, data) },
		(_, presentation: CapabilityPresentationCreate) =>
			command.client.capabilities.createPresentation(id.id, id.version, presentation),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
