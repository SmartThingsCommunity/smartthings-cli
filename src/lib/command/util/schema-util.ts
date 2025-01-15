import {
	type SchemaApp,
	type SchemaAppRequest,
	type SmartThingsClient,
	type SmartThingsURLProvider,
	type ViperAppLinks,
} from '@smartthings/core-sdk'

import {
	booleanDef,
	createFromUserInput,
	type InputDefinition,
	listSelectionDef,
	maxItemValueLength,
	objectDef,
	optionalDef,
	optionalStringDef,
	staticDef,
	stringDef,
	updateFromUserInput,
} from '../../item-input/index.js'
import { clipToMaximum, fatalError } from '../../util.js'
import { emailValidate, httpsURLValidate } from '../../validate-util.js'
import { type APICommand } from '../api-command.js'
import { chooseOrganization, organizationDef } from './organizations-util.js'
import { arnDef, webHookUrlDef } from './schema-input-primitives.js'
import { type ChooseFunction, createChooseFn } from './util-util.js'
import { stdinIsTTY, stdoutIsTTY } from '../../io-util.js'


export type SchemaAppWithOrganization = SchemaAppRequest & {
	organizationId?: string
}

// Create a type with some extra temporary fields.
export type InputData = SchemaAppWithOrganization & {
	includeAppLinks: boolean
}

export const validateFinal = (schemaAppRequest: InputData): true | string => {
	if ( schemaAppRequest.hostingType === 'lambda'
			&& !schemaAppRequest.lambdaArn
			&& !schemaAppRequest.lambdaArnEU
			&& !schemaAppRequest.lambdaArnAP
			&& !schemaAppRequest.lambdaArnCN) {
		return 'At least one lambda ARN is required.'
	}
	return true
}

export const appLinksDefSummarize = (value?: ViperAppLinks): string =>
	clipToMaximum(`android: ${value?.android}, ios: ${value?.ios}`, maxItemValueLength)

export const buildInputDefinition = async (
		command: APICommand,
		initialValue?: SchemaApp,
): Promise<InputDefinition<InputData>> => {
	// TODO: should do more type checking on this, perhaps using zod or similar
	const baseURL = (command.profile.clientIdProvider as SmartThingsURLProvider | undefined)?.baseURL
	const inChina = typeof baseURL === 'string' && baseURL.endsWith('cn')

	const hostingTypeDef = inChina
		? staticDef('lambda')
		: listSelectionDef('Hosting Type', ['lambda', 'webhook'], { default: 'webhook' })

	const appLinksDef = objectDef<ViperAppLinks>('App-to-app Links', {
		android: stringDef('Android Link'),
		ios: stringDef('iOS Link'),
		isLinkingEnabled: staticDef(true),
	}, { summarizeForEdit: appLinksDefSummarize })

	return objectDef<InputData>('Schema App', {
		organizationId: organizationDef(
			'Schema connector',
			await command.client.organizations.list(),
		),
		partnerName: stringDef('Partner Name'),
		userEmail: stringDef('User email', { validate: emailValidate }),
		appName: optionalStringDef('App Name', {
			default: (context?: unknown[]) =>
				(context?.[0] as Pick<SchemaAppRequest, 'partnerName'>)?.partnerName ?? '',
		}),
		oAuthAuthorizationUrl: stringDef('OAuth Authorization URL', { validate: httpsURLValidate }),
		oAuthTokenUrl: stringDef('Partner OAuth Refresh Token URL', { validate: httpsURLValidate }),
		icon: optionalStringDef('Icon URL', { validate: httpsURLValidate }),
		icon2x: optionalStringDef('2x Icon URL', { validate: httpsURLValidate }),
		icon3x: optionalStringDef('3x Icon URL', { validate: httpsURLValidate }),
		oAuthClientId: stringDef('Partner OAuth Client Id'),
		oAuthClientSecret: stringDef('Partner OAuth Client Secret'),
		oAuthScope: optionalStringDef('Partner OAuth Scope'),
		schemaType: staticDef('st-schema'),
		hostingType: hostingTypeDef,
		lambdaArn: arnDef('Lambda ARN for US region', inChina, initialValue),
		lambdaArnEU: arnDef('Lambda ARN for EU region', inChina, initialValue),
		lambdaArnCN: arnDef('Lambda ARN for CN region', inChina, initialValue, { forChina: true }),
		lambdaArnAP: arnDef('Lambda ARN for AP region', inChina, initialValue),
		webhookUrl: webHookUrlDef(inChina, initialValue),
		includeAppLinks: booleanDef('Enable app-to-app linking?', { default: false }),
		viperAppLinks: optionalDef(appLinksDef,
			(context?: unknown[]) =>
				(context?.[0] as Pick<InputData, 'includeAppLinks'>)?.includeAppLinks,
			{ initiallyActive: !!initialValue?.viperAppLinks }),
	}, { validateFinal })
}

const stripTempInputFields = (inputData: InputData): SchemaAppWithOrganization => {
	// Strip out extra temporary data to make the `InputData` into a `SchemaAppRequest`.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { includeAppLinks, ...result } = inputData

	return result
}

export const getSchemaAppUpdateFromUser = async (
		command: APICommand,
		original: SchemaApp, dryRun: boolean,
): Promise<SchemaAppWithOrganization> => {
	const inputDef = await buildInputDefinition(command, original)

	const inputData = await updateFromUserInput(command, inputDef,
		{ ...original, includeAppLinks: !!original.viperAppLinks }, { dryRun })

	return stripTempInputFields(inputData)
}

export const getSchemaAppCreateFromUser = async (
		command: APICommand,
		dryRun: boolean,
): Promise<SchemaAppWithOrganization> => {
	const inputDef = await buildInputDefinition(command)

	const inputData = await createFromUserInput(command, inputDef, { dryRun })

	return stripTempInputFields(inputData)
}

export const chooseSchemaAppFn = (): ChooseFunction<SchemaApp> => createChooseFn(
	{
		itemName: 'schema app',
		primaryKeyName: 'endpointAppId',
		sortKeyName: 'appName',
	},
	(client: SmartThingsClient): Promise<SchemaApp[]> => client.schema.list(),
)

export const chooseSchemaApp = chooseSchemaAppFn()

// The endpoint to get a schema app automatically assigns the users org to an app if it
// doesn't have one already. This causes a problem if the app is certified because the user
// organization is almost certainly the wrong one and the user can't change it after it's been
// set. So, here we check to see if the app has an organization before we query it and
// prompt the user for the correct organization.
export const getSchemaAppEnsuringOrganization = async (
		command: APICommand,
		schemaAppId: string,
		flags: {
			json?: boolean
			yaml?: boolean
			input?: string
			output?: string
		},
): Promise<{ schemaApp: SchemaApp; organizationWasUpdated: boolean }> => {
	const apps = await command.client.schema.list()
	const appFromList = apps.find(app => app.endpointAppId === schemaAppId)
	if (appFromList && !appFromList.organizationId) {
		if (flags.json || flags.yaml || flags.output || flags.input || !stdinIsTTY()  || !stdoutIsTTY()) {
			return fatalError(
				'Schema app does not have an organization associated with it.\n' +
					`Please run "smartthings schema ${schemaAppId}" and choose an organization when prompted.`,
			)
		}
		// If we found an app but it didn't have an organization, ask the user to choose one.
		// (If we didn't find an app at all, it's safe to use the single get because that means
		// either it doesn't exist (bad app id) or it already has an organization.)
		console.log(
			`The schema "${appFromList.appName}" (${schemaAppId}) does not have an organization\n` +
				'You must choose one now.',
		)
		const organizationId = await chooseOrganization(command)
		const organization = await command.client.organizations.get(organizationId)
		// eslint-disable-next-line @typescript-eslint/naming-convention
		const orgClient = command.client.clone({ 'X-ST-Organization': organizationId })
		const schemaApp = await orgClient.schema.get(schemaAppId)
		console.log(`\nSchema app "${schemaApp.appName} (${schemaAppId}) is now associated with ` +
			`organization ${organization.name} (${organizationId}).\n`)
		return { schemaApp, organizationWasUpdated: true }
	}
	return { schemaApp: await command.client.schema.get(schemaAppId), organizationWasUpdated: false }
}
