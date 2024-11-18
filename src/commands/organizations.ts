import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type OrganizationResponse } from '@smartthings/core-sdk'

import {
	apiCommand,
	apiCommandBuilder,
	type APICommandFlags,
} from '../lib/command/api-command.js'
import {
	type OutputItemOrListConfig,
	type OutputItemOrListFlags,
	outputItemOrList,
	outputItemOrListBuilder,
} from '../lib/command/listing-io.js'
import { tableFieldDefinitions } from '../lib/command/util/organizations-util.js'


export type CommandArgs = APICommandFlags & OutputItemOrListFlags & {
	idOrIndex?: string
}

const command = 'organizations [id-or-index]'

const describe = 'get a specific organization or list organizations the user belongs to'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemOrListBuilder(apiCommandBuilder(yargs))
		.positional(
			'id-or-index',
			{ describe: 'the organization name or number from list', type: 'string' },
		)
		.example([
			['$0 organizations', 'list all organizations the user is a member of'],
			[
				'$0 organizations 1',
				'display details for the first organization in the list retrieved by running ' +
					'"smartthings organizations"',
			],
			[
				'$0 organizations MyCompanyOrgName',
				'display details for an organization by name',
			],
		])

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const config: OutputItemOrListConfig<OrganizationResponse> = {
		tableFieldDefinitions,
		primaryKeyName: 'organizationId',
		sortKeyName: 'name',
		listTableFieldDefinitions: ['name', 'label', 'organizationId', 'isDefaultUserOrg'],
	}

	await outputItemOrList(command, config, argv.idOrIndex,
		() => command.client.organizations.list(),
		id => command.client.organizations.get(id),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
