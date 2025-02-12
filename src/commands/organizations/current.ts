import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type OrganizationResponse } from '@smartthings/core-sdk'

import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../lib/command/api-organization-command.js'
import {
	formatAndWriteItem,
	formatAndWriteItemBuilder,
	type FormatAndWriteItemFlags,
} from '../../lib/command/format.js'
import { tableFieldDefinitions } from '../../lib/command/util/organizations-util.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& FormatAndWriteItemFlags

const command = 'organizations:current'

const describe = 'get the currently active organization'

export const builder = (yargs: Argv): Argv<CommandArgs> =>
	formatAndWriteItemBuilder(apiOrganizationCommandBuilder(yargs))
		.example([
			[
				'$0 organizations:current',
				'display the currently active organization',
			],
			[
				'$0 organizations:current --profile org2',
				'display the currently active organization for the profile "org2',
			],
		])

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const currentOrganizationId = command.cliConfig.stringConfigValue('organization')
	const getOrganization = async (id: string): Promise<OrganizationResponse | undefined> => {
		try {
			return await command.client.organizations.get(id)
		} catch (error) {
			if (error.response?.status === 403) {
				return undefined
			}
			throw error
		}
	}
	const currentOrganization = currentOrganizationId
		? await getOrganization(currentOrganizationId)
		: (await command.client.organizations.list()).find(org => org.isDefaultUserOrg)

	if (currentOrganization) {
		await formatAndWriteItem(command, { tableFieldDefinitions }, currentOrganization)
	} else {
		if (currentOrganizationId) {
			console.error(`Organization '${currentOrganizationId}' not found`)
		} else {
			console.error('Could not find an active organization.')
		}
	}
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
