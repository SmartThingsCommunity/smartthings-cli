import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type CapabilityNamespace } from '@smartthings/core-sdk'

import { buildEpilog } from '../../lib/help.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../lib/command/api-organization-command.js'
import {
	outputList,
	outputListBuilder,
	type OutputListConfig,
	type OutputListFlags,
} from '../../lib/command/output-list.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& OutputListFlags

const command = 'capabilities:namespaces'

const describe = 'list all capability namespaces currently available in a user account'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputListBuilder(apiOrganizationCommandBuilder(yargs))
		.example([
			[
				'$0 capabilities:namespaces',
				'list namespaces',
			],
		])
		.epilog(buildEpilog({ command }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const config: OutputListConfig<CapabilityNamespace> = {
		sortKeyName: 'name',
		primaryKeyName: 'name',
		listTableFieldDefinitions: ['name', 'ownerType', 'ownerId'],
	}
	await outputList(command, config, () => command.client.capabilities.listNamespaces())
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
