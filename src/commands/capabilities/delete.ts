import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { buildEpilog } from '../../lib/help.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../lib/command/api-organization-command.js'
import { capabilityIdBuilder, type CapabilityIdInputFlags } from '../../lib/command/capability-flags.js'
import { chooseCapability } from '../../lib/command/util/capabilities-choose.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& CapabilityIdInputFlags

const command = 'capabilities:delete [id]'

const describe = 'delete a capability'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	capabilityIdBuilder(apiOrganizationCommandBuilder(yargs))
		.example([
			['$0 capabilities:delete', 'prompt for a capability and delete it'],
			[
				'$0 capabilities:delete cathappy12345.myCapability',
				'delete the capability with the specified id',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'deleteCapability' }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const id = await chooseCapability(command, argv.id, argv.capabilityVersion)
	await command.client.capabilities.delete(id.id, id.version)
	console.log(`capability ${id.id} (version ${id.version}) deleted`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
