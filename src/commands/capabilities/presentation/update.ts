import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { CapabilityPresentation, type CapabilityPresentationUpdate } from '@smartthings/core-sdk'

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
import { buildTableOutput } from '../../../lib/command/util/capabilities-presentation-table.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& InputAndOutputItemFlags
	& CapabilityIdInputFlags

const command = 'capabilities:presentation:update [id]'

const describe = 'update presentation information of a capability'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(capabilityIdBuilder(apiOrganizationCommandBuilder(yargs)))
		.example([
			[
				'$0 capabilities:presentation:update -i presentation.json',
				'prompt for a capability and update its presentation with the one defined in presentation.json',
			],
			[
				'$0 capabilities:presentation:update -i presentation.json cathappy12345.myCapability',
				'update the presentation for capability cathappy12345.myCapability with the one defined in presentation.json',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'updateCustomCapabilityPresentation' }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const id = await chooseCapability(command, argv.id, argv.capabilityVersion)
	await inputAndOutputItem<CapabilityPresentationUpdate, CapabilityPresentation>(
		command,
		{ buildTableOutput: data => buildTableOutput(command.tableGenerator, data) },
		(_, capabilityPresentation) =>
			command.client.capabilities.updatePresentation(id.id, id.version, capabilityPresentation),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
