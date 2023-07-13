import { Flags } from '@oclif/core'

import { APICommand } from '@smartthings/cli-lib'

import { chooseSchemaInvitation } from '../../../lib/commands/invites-utils'


export default class InvitesSchemaDeleteCommand extends APICommand<typeof InvitesSchemaDeleteCommand.flags> {
	static description = 'delete a schema app invitation'

	static flags = {
		...APICommand.flags,
		// eslint-disable-next-line @typescript-eslint/naming-convention
		'schema-app': Flags.string({
			description: 'schema app id',
		}),
	}

	static args = [{
		name: 'id',
		description: 'schema app invitation UUID',
	}]

	static examples = [
		{
			description: 'select an invitation to delete from list',
			command: 'smartthings invites:schema:delete',
		},
		{
			description: 'select an invitation to delete from list, for the specified schema app',
			command: 'smartthings invites:schema:delete --schema-app e077532e-3c0f-4f3b-a1d8-029115ee1602',
		},
		{
			description: 'delete a specific invitation by id',
			command: 'smartthings invites:schema:delete 5dfd6626-ab1d-42da-bb76-90def3153998',
		},
	]

	async run(): Promise<void> {
		const id = await chooseSchemaInvitation(this, this.flags['schema-app'], this.args.id)
		await this.client.invitesSchema.revoke(id)
		this.log(`Invitation ${id} deletion requested. (This may take a few moments to complete.)`)
	}
}
