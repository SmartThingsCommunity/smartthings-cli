import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type SmartThingsClient } from '@smartthings/core-sdk'

import { buildEpilog } from '../../lib/help.js'
import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../../lib/command/api-command.js'
import {
	outputItemOrList,
	outputItemOrListBuilder,
	type OutputItemOrListConfig,
	type OutputItemOrListFlags,
} from '../../lib/command/listing-io.js'
import { addAppDetails, getSingleInvite, type InvitationWithAppDetails } from '../../lib/command/util/schema-invites.js'
import { tableFieldDefinitions } from '../../lib/command/util/schema-invites-table.js'


export type CommandArgs =
	& APICommandFlags
	& OutputItemOrListFlags
	& {
		schemaApp?: string
		idOrIndex?: string
	}

const command = 'invites:schema [id-or-index]'

const describe = 'list invitations for a schema app or display details for an invitation'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemOrListBuilder(apiCommandBuilder(yargs))
		.positional('id-or-index', { describe: 'the invitation id or number in list', type: 'string' })
		.option('schema-app', {
			describe: 'Schema App id',
			type: 'string',
		})
		.option('verbose',
			{ alias: 'v', describe: 'include location name in output', type: 'boolean', default: false })
		.example([
			[
				'$0 invites:schema',
				'list invitations for all schema apps',
			],
			[
				'$0 invites:schema --schema-app=viper_7db10232-3f97-4618-924b-807bf852c616',
				'list invitations for the specified schema app',
			],
			[
				'$0 invites:schema --schema-app=viper_7db10232-3f97-4618-924b-807bf852c616 3',
				'display details about the third invitation listed in the previous example',
			],
			[
				'$0 invites:schema 97e44afd-845f-4da1-a7b3-fd2625fc9367',
				'list details of specified invitation',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'listSchemaAppInvitations' }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	type InvitationProviderFunction = () => Promise<InvitationWithAppDetails[]>
	const listFn = (client: SmartThingsClient, appId?: string): InvitationProviderFunction =>
		async (): Promise<InvitationWithAppDetails[]> => {
			// We have to be careful to not use the method to get a single app. For more
			// details see `getSchemaAppEnsuringOrganization` in schema-utils.
			const apps = appId
				? (await client.schema.list({ includeAllOrganizations: true }))
					.filter(app => app.endpointAppId === appId)
				: await client.schema.list()
			return (await Promise.all(apps.map(async app => {
				return app.endpointAppId
					?  (await client.invitesSchema.list(app.endpointAppId))
						.map(invite => addAppDetails(invite, app))
					: []
			}))).flat()
		}

	const config: OutputItemOrListConfig<InvitationWithAppDetails> = {
		primaryKeyName: 'id',
		sortKeyName: 'sort',
		itemName: 'schema app invitation',
		listTableFieldDefinitions: [{ prop: 'id', label: 'Invitation Id' }, 'schemaAppName', 'description'],
		tableFieldDefinitions,
	}
	await outputItemOrList(
		command,
		config,
		argv.idOrIndex,
		listFn(command.client, argv.schemaApp),
		id => getSingleInvite(command.client, argv.schemaApp, id))
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
