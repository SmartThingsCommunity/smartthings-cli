import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type Capability, type CapabilityUpdate } from '@smartthings/core-sdk'

import { apiDocsURL } from '../../lib/command/api-command.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../lib/command/api-organization-command.js'
import { capabilityIdBuilder, type CapabilityIdInputFlags } from '../../lib/command/capability-flags.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemFlags,
} from '../../lib/command/input-and-output-item.js'
import { chooseCapability } from '../../lib/command/util/capabilities-choose.js'
import { buildTableOutput } from '../../lib/command/util/capabilities-table.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& InputAndOutputItemFlags
	& CapabilityIdInputFlags

const command = 'capabilities:update [id]'

const describe = 'update a capability'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(capabilityIdBuilder(apiOrganizationCommandBuilder(yargs)))
		.example([
			[
				'$0 capabilities:update -i my-capability.json',
				'prompt for a capability and update it using the data in "my-capability.json"',
			],
			[
				'$0 capabilities:update cathappy12345.myCapability --input my-capability.json',
				'update the capability with the given id using the data in "my-capability.json"',
			],
		])
		.epilog(apiDocsURL('updateCapability'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const id = await chooseCapability(command, argv.id, argv.capabilityVersion)
	await inputAndOutputItem<CapabilityUpdate, Capability>(
		command,
		{ buildTableOutput: data => buildTableOutput(command.tableGenerator, data) },
		(_, capability) => command.client.capabilities.update(id.id, id.version, capability),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
