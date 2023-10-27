import { Flags } from '@oclif/core'

import { SmartThingsClient } from '@smartthings/core-sdk'

import {
	APICommand,
	outputItemOrList,
	OutputItemOrListConfig,
} from '@smartthings/cli-lib'

import { addAppDetails, getSingleInvite, InvitationWithAppDetails, tableFieldDefinitions } from '../../lib/commands/invites-utils'


export default class InvitesSchemaCommand extends APICommand<typeof InvitesSchemaCommand.flags> {
	static description = 'list invitations for a schema app'

	static flags = {
		...APICommand.flags,
		...outputItemOrList.flags,
		// eslint-disable-next-line @typescript-eslint/naming-convention
		'schema-app': Flags.string({
			description: 'schema app id',
		}),
	}

	static args = [{
		name: 'idOrIndex',
		description: 'the invitation id or number in list',
	}]

	static examples = [
		{
			description: 'prompt for a schema app and then list its invitations',
			command: 'smartthings invites:schema',
		},
		{
			description: 'list invitations for the specified schema app',
			command: 'smartthings invites:schema --schema-app=viper_7db10232-3f97-4618-924b-807bf852c616',
		},
		{
			description: 'display details about the third invitation listed in the previous example',
			command: 'smartthings invites:schema --schema-app=viper_7db10232-3f97-4618-924b-807bf852c616 3',
		},
		{
			description: 'list details of specified invitation',
			command: 'smartthings invites:schema 97e44afd-845f-4da1-a7b3-fd2625fc9367',
		},
	]

	async run(): Promise<void> {
		type InvitationProviderFunction = () => Promise<InvitationWithAppDetails[]>
		const listFn = (client: SmartThingsClient, appId?: string): InvitationProviderFunction =>
			async (): Promise<InvitationWithAppDetails[]> => {
				const apps = appId
					? [await client.schema.get(appId)]
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
		await outputItemOrList(this, config, this.args.idOrIndex,
			listFn(this.client, this.flags['schema-app']),
			id => getSingleInvite(this.client, this.flags['schema-app'], id))
	}
}
