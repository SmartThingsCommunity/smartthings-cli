import { Flags } from '@oclif/core'

import { APICommand, FormatAndWriteItemConfig, formatAndWriteItem } from '@smartthings/cli-lib'

import { chooseSchemaInvitation } from '../../../lib/commands/invites-utils'
import { SchemaAppAcceptanceStatus } from '@smartthings/core-sdk'


export default class DeviceStatusCommand extends APICommand<typeof DeviceStatusCommand.flags> {
	static description = 'check the acceptance status of a schema app invitation'

	static flags = {
		...APICommand.flags,
		...formatAndWriteItem.flags,
		// eslint-disable-next-line @typescript-eslint/naming-convention
		'schema-app': Flags.string({
			description: 'schema app id',
		}),
	}

	static args = [{
		name: 'id',
		description: 'the invitation id',
	}]

	static examples = [
		{
			description: 'prompt for an invitation and check its acceptance status',
			command: 'smartthings invites:schema:check-acceptance',
		},
		{
			description: 'check acceptance status for the specified invitation',
			command: 'smartthings invites:schema:check-acceptance 7bd4c5b6-e840-44b3-9933-549a342d95ce',
		},
	]

	async run(): Promise<void> {
		const id = await chooseSchemaInvitation(this, this.flags['schema-app'], this.args.idOrIndex)
		const status = await this.client.invitesSchema.getAcceptanceStatus(id)
		const config: FormatAndWriteItemConfig<SchemaAppAcceptanceStatus> = {
			tableFieldDefinitions: ['isAccepted', 'description', 'shortCode'],
		}
		await formatAndWriteItem(this, config, status)
	}
}
