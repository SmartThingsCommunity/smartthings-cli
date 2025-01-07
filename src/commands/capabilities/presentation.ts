import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { apiDocsURL } from '../../lib/command/api-command.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../lib/command/api-organization-command.js'
import {
	capabilityIdOrIndexBuilder,
	type CapabilityIdOrIndexInputFlags,
} from '../../lib/command/capability-flags.js'
import {
	formatAndWriteItem,
	formatAndWriteItemBuilder,
	type FormatAndWriteItemFlags,
} from '../../lib/command/format.js'
import { chooseCapability } from '../../lib/command/util/capabilities-choose.js'
import { buildTableOutput } from '../../lib/command/util/capabilities-presentation-table.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& CapabilityIdOrIndexInputFlags
	& FormatAndWriteItemFlags
	& {
		namespace?: string
	}

const command = 'capabilities:presentation [id-or-index] [capability-version]'

const describe = 'get presentation information for a specific capability'

export const builder = (yargs: Argv): Argv<CommandArgs> =>
	formatAndWriteItemBuilder(capabilityIdOrIndexBuilder(apiOrganizationCommandBuilder(yargs)))
		.option('namespace', {
			alias: 'n',
			description: 'a specific namespace to query; will use all by default',
			type: 'string',
		})
		.example([
			[
				'$0 capabilities:presentations',
				'prompt for a capability and display its presentation information',
			],
			[
				'$0 capabilities:presentations --namespace cathappy12345',
				'prompt for a capability from the specified namespace and display its' +
					' presentation information',
			],
			[
				'$0 capabilities:presentations cathappy12345.myCapability',
				'display details for a capability by id',
			],
			[
				'$0 capabilities:presentations 1',
				'display presentation information for the first capability in the list retrieved' +
					' by running "smartthings capabilities"',
			],
		])
		.epilog(apiDocsURL('getCapabilityPresentation'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const capabilityId = await chooseCapability(
		command,
		argv.idOrIndex,
		argv.capabilityVersion,
		undefined,
		argv.namespace,
		{ allowIndex: true },
	)
	const presentation =
		await command.client.capabilities.getPresentation(capabilityId.id, capabilityId.version)
	await formatAndWriteItem(
		command,
		{ buildTableOutput: data => buildTableOutput(command.tableGenerator, data) },
		presentation,
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
