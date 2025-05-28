import {
	OrganizationResponse,
	SchemaApp,
	SchemaAppRequest,
	SmartThingsURLProvider,
	ViperAppLinks,
} from '@smartthings/core-sdk'

import {
	APICommand,
	booleanDef,
	ChooseOptions,
	chooseOptionsWithDefaults,
	clipToMaximum,
	createFromUserInput,
	emailValidate,
	httpsURLValidate,
	InputDefinition,
	listSelectionDef,
	maxItemValueLength,
	objectDef,
	optionalDef,
	optionalStringDef,
	selectDef,
	selectFromList,
	SelectFromListConfig,
	staticDef,
	stdinIsTTY,
	stdoutIsTTY,
	stringDef,
	stringTranslateToId,
	undefinedDef,
	updateFromUserInput,
	urlValidateFn,
} from '@smartthings/cli-lib'
import { awsHelpText } from '../aws-utils'
import { chooseOrganization } from './organization-util'
import { CLIError } from '@oclif/core/lib/errors'


export const SCHEMA_AWS_PRINCIPAL = '148790070172'

export const arnDef = (name: string, inChina: boolean, initialValue?: SchemaAppRequest, options?: { forChina?: boolean }): InputDefinition<string | undefined> => {
	if (inChina && !options?.forChina || !inChina && options?.forChina) {
		return undefinedDef
	}

	const helpText = awsHelpText
	const initiallyActive = initialValue?.hostingType === 'lambda'

	// In China there is only one ARN field so we can make it required. Globally there are three
	// and at least one of the three is required, but individually all are optional.
	// (See `validateFinal` function below for the validation requiring at least one.)
	return optionalDef(inChina ? stringDef(name, { helpText }) : optionalStringDef(name, { helpText }),
		(context?: unknown[]) => (context?.[0] as Pick<SchemaAppRequest, 'hostingType'>)?.hostingType === 'lambda',
		{ initiallyActive })
}

// The SmartThings services handling Schema Apps are limited to connecting to apps in the range 80-8002.
export const schemaOutURLValidate = urlValidateFn({ httpsRequired: true, minPort: 80, maxPort: 8002 })

export const webHookUrlDef = (inChina: boolean, initialValue?: SchemaAppRequest): InputDefinition<string | undefined> => {
	if (inChina) {
		return undefinedDef
	}

	const initiallyActive = initialValue?.hostingType === 'webhook'
	return optionalDef(stringDef('Webhook URL', { validate: schemaOutURLValidate }),
		(context?: unknown[]) => (context?.[0] as Pick<SchemaAppRequest, 'hostingType'>)?.hostingType === 'webhook',
		{ initiallyActive })
}

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

export const organizationDef = (organizations: OrganizationResponse[]): InputDefinition<string | undefined> => {
	if (organizations.length < 1) {
		return undefinedDef
	}
	if (organizations.length === 1) {
		return staticDef(organizations[0].organizationId)
	}

	const choices = organizations
		.map(organization => ({
			name: organization.label ? `${organization.name} (${organization.label})` : organization.name,
			value: organization.organizationId,
		}))

	const helpText = 'The organization with which the Schema connector should be associated.'

	return selectDef('Organization', choices, { helpText })
}

export const buildInputDefinition = async (
		command: APICommand<typeof APICommand.flags>,
		initialValue?: SchemaApp,
): Promise<InputDefinition<InputData>> => {
	// TODO: should do more type checking on this, perhaps using zod or
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
		organizationId: organizationDef(await command.client.organizations.list()),
		partnerName: stringDef('Partner Name'),
		userEmail: stringDef('User email', { validate: emailValidate }),
		appName: optionalStringDef('App Name', {
			default: (context?: unknown[]) => (context?.[0] as Pick<SchemaAppRequest, 'partnerName'>)?.partnerName ?? '',
		}),
		oAuthAuthorizationUrl: stringDef('OAuth Authorization URL', { validate: schemaOutURLValidate }),
		oAuthTokenUrl: stringDef('Partner OAuth Refresh Token URL', { validate: schemaOutURLValidate }),
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
			(context?: unknown[]) => (context?.[0] as Pick<InputData, 'includeAppLinks'>)?.includeAppLinks,
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
		command: APICommand<typeof APICommand.flags>,
		original: SchemaApp, dryRun: boolean,
): Promise<SchemaAppWithOrganization> => {
	const inputDef = await buildInputDefinition(command, original)

	const inputData = await updateFromUserInput(command, inputDef,
		{ ...original, includeAppLinks: !!original.viperAppLinks }, { dryRun })

	return stripTempInputFields(inputData)
}

export const getSchemaAppCreateFromUser = async (
		command: APICommand<typeof APICommand.flags>,
		dryRun: boolean,
): Promise<SchemaAppWithOrganization> => {
	const inputDef = await buildInputDefinition(command)

	const inputData = await createFromUserInput(command, inputDef, { dryRun })

	return stripTempInputFields(inputData)
}

export const chooseSchemaApp = async (command: APICommand<typeof APICommand.flags>, schemaAppFromArg?: string, options?: Partial<ChooseOptions<SchemaApp>>): Promise<string> => {
	const opts = chooseOptionsWithDefaults(options)
	const config: SelectFromListConfig<SchemaApp> = {
		itemName: 'schema app',
		primaryKeyName: 'endpointAppId',
		sortKeyName: 'appName',
	}
	const listItems = (): Promise<SchemaApp[]> => command.client.schema.list()
	const preselectedId = opts.allowIndex
		? await stringTranslateToId(config, schemaAppFromArg, listItems)
		: schemaAppFromArg
	return selectFromList(command, config, { preselectedId, listItems, autoChoose: true })
}

// The endpoint to get a schema app automatically assigns the users org to an app if it
// doesn't have one already. This causes a problem if the app is certified because the user
// organization is almost certainly the wrong one and the user can't change it after it's been
// set. So, here we check to see if the app has an organization before we query it and
// prompt the user for the correct organization.
export const getSchemaAppEnsuringOrganization = async (
		command: APICommand<typeof APICommand.flags>,
		schemaAppId: string,
		flags: {
			json: boolean
			yaml: boolean
			input?: string
			output?: string
		},
): Promise<{ schemaApp: SchemaApp; organizationWasUpdated: boolean }> => {
	const apps = await command.client.schema.list()
	const appFromList = apps.find(app => app.endpointAppId === schemaAppId)
	if (appFromList && !appFromList.organizationId) {
		if (flags.json || flags.yaml || flags.output || flags.input || !stdinIsTTY()  || !stdoutIsTTY()) {
			throw new CLIError(
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
