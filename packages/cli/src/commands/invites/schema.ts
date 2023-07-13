import { Flags } from '@oclif/core'

import { SchemaAppInvitation } from '@smartthings/core-sdk'

import {
	APICommand,
	outputItemOrList,
	OutputItemOrListConfig,
} from '@smartthings/cli-lib'

import { getSingleInvite, inviteTableFieldDefinitions } from '../../lib/commands/invites-utils'
import { chooseSchemaApp } from '../../lib/commands/schema-util'


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
		const config: OutputItemOrListConfig<SchemaAppInvitation> = {
			primaryKeyName: 'id',
			sortKeyName: 'description',
			itemName: 'schema app invitation',
			listTableFieldDefinitions: ['id', 'description', 'shortCode'],
			tableFieldDefinitions: inviteTableFieldDefinitions,
		}
		const list = async (): Promise<SchemaAppInvitation[]> => {
			const schemaAppId = await chooseSchemaApp(this, this.flags['schema-app'])
			return this.client.invitesSchema.list(schemaAppId)
		}
		await outputItemOrList(this, config, this.args.idOrIndex,
			list, id => getSingleInvite(this.client, this.flags['schema-app'], id))
	}
}
