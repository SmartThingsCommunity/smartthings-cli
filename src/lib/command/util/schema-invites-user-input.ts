import { type SchemaApp, type SchemaAppInvitationCreate } from '@smartthings/core-sdk'

import {
	type CancelAction,
	createFromUserInput,
	objectDef,
	optionalIntegerDef,
	optionalStringDef,
	type InputDefinition,
} from '../../item-input/index.js'
import { type APICommand } from '../api-command.js'
import { type InputAndOutputItemFlags } from '../input-and-output-item.js'
import { chooseSchemaApp, getSchemaAppEnsuringOrganization } from './schema-util.js'


export const getInputFromUser = async (
		command: APICommand,
		flags: InputAndOutputItemFlags & { schemaApp?: string },
): Promise<SchemaAppInvitationCreate> => {
	// Save selected schema apps so we can access their name quickly for summarizeForEdit below.
	const schemaAppsById = new Map<string, SchemaApp>()

	const updateFromUserInput = async (): Promise<string | CancelAction> => {
		const schemaAppId = await chooseSchemaApp(command, flags.schemaApp, { autoChoose: true })
		if (!schemaAppsById.has(schemaAppId)) {
			const { schemaApp } = await getSchemaAppEnsuringOrganization(command, schemaAppId, flags)
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

	const createInputDefinition = objectDef<SchemaAppInvitationCreate>(
		'Schema App Invitation',
		{
			schemaAppId: schemaAppIdDef,
			description: optionalStringDef('Description'),
			acceptLimit: optionalIntegerDef('Accept Limit',
				{
					helpText: 'Enter the maximum number of users you want to be able to accept the invitation.\n' +
						'Leave blank for no maximum.',
				}),
		},
	)

	return createFromUserInput(command, createInputDefinition, { dryRun: !!flags.dryRun })
}
