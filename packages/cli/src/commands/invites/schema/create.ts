import { Flags } from '@oclif/core'

import { SchemaApp, SchemaAppInvitationCreate } from '@smartthings/core-sdk'

import {
	APICommand,
	CancelAction,
	createFromUserInput,
	inputAndOutputItem,
	InputDefinition,
	objectDef,
	optionalIntegerDef,
	optionalStringDef,
	userInputProcessor,
} from '@smartthings/cli-lib'

import { chooseSchemaApp } from '../../../lib/commands/schema-util'
import { getSingleInvite, InvitationWithAppDetails, tableFieldDefinitions } from '../../../lib/commands/invites-utils'


export default class InvitesSchemaCreateCommand extends APICommand<typeof InvitesSchemaCreateCommand.flags> {
	static description = 'create an invitation to a schema app'

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
		// eslint-disable-next-line @typescript-eslint/naming-convention
		'schema-app': Flags.string({
			description: 'schema app id',
		}),
	}

	static examples = [
		{
			description: 'create an invitation from prompted input',
			command: 'smartthings invites:schema:create',
		},
		{
			description: 'create an invitation for the specified ST Schema app from prompted input',
			command: 'smartthings invites:schema:create --schema-app d2e44c34-3cb1-42be-b5ba-8fbaf2922c19',
		},
		{
			description: 'create an invitation as defined in invitation.json, prompting the user for a schema-app',
			command: 'smartthings invites:schema:create -i invitation.json',
		},
		{
			description: 'create an invitation as defined in invitation.json with the specified schema-app',
			command: 'smartthings invites:schema:create -i invitation.json --schema-app d2e44c34-3cb1-42be-b5ba-8fbaf2922c19',
		},
	]

	async getInputFromUser(): Promise<SchemaAppInvitationCreate> {
		// Save selected schema apps so we can access their name quickly for summarizeForEdit below.
		const schemaAppsById = new Map<string, SchemaApp>()

		const updateFromUserInput = async (): Promise<string | CancelAction> => {
			const schemaAppId = await chooseSchemaApp(this, this.flags['schema-app'])
			if (!schemaAppsById.has(schemaAppId)) {
				const schemaApp = await this.client.schema.get(schemaAppId)
				schemaAppsById.set(schemaAppId, schemaApp)
			}
			return schemaAppId
		}

		const schemaAppIdDef: InputDefinition<string> = {
			name: 'Schema App',
			buildFromUserInput: () => updateFromUserInput(),
			summarizeForEdit: (schemaAppId: string): string => {
				const schemaApp = schemaAppsById.get(schemaAppId)
				return schemaApp ? schemaApp.appName ?? schemaApp.endpointAppId ?? 'unnamed' : 'none chosen'
			},
			updateFromUserInput,
		}

		const createInputDefinition = objectDef<SchemaAppInvitationCreate>('Schema App Invitation', {
			schemaAppId: schemaAppIdDef,
			description: optionalStringDef('Description'),
			acceptLimit: optionalIntegerDef('Accept (Install) Limit', {
				helpText:
					'Invitations are limited to a maximum of 500 installations (called "accept"s by the API) by default and are only valid for 30 days.\n' +
					'Once either the install limit or the time limit is reached, you will need to create a new invitation.\n' +
					'Leave blank to accept the default or enter a different install limit if desired.\n',
			}),
		})

		return createFromUserInput(this, createInputDefinition, { dryRun: this.flags['dry-run'] })
	}

	async run(): Promise<void> {
		const createInvitation = async (_: unknown, input: SchemaAppInvitationCreate): Promise<InvitationWithAppDetails> => {
			// We don't need the full schema app but we need to call this to force some
			// bookkeeping in the back end for older apps.
			await this.client.schema.get(input.schemaAppId)
			const idWrapper = await this.client.invitesSchema.create(input)
			return getSingleInvite(this.client, input.schemaAppId, idWrapper.invitationId)
		}
		await inputAndOutputItem<SchemaAppInvitationCreate, InvitationWithAppDetails>(this,
			{ tableFieldDefinitions }, createInvitation, userInputProcessor(this))
	}
}
