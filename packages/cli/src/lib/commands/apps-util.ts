import { AppListOptions, AppOAuthRequest, AppResponse, AppSettingsResponse, PagedApp, SmartThingsClient } from '@smartthings/core-sdk'

import {
	APICommand,
	arrayDef,
	checkboxDef,
	ChooseOptions,
	chooseOptionsWithDefaults,
	localhostOrHTTPSValidate,
	selectFromList,
	SelectFromListConfig,
	stringDef,
	stringTranslateToId,
	TableFieldDefinition,
	TableGenerator,
} from '@smartthings/cli-lib'


const isWebhookSmartApp = (app: AppResponse): boolean => !!app.webhookSmartApp
const hasSubscription = (app: AppResponse): boolean => !!app.apiOnly?.subscription

export const tableFieldDefinitions: TableFieldDefinition<AppResponse>[] = [
	'displayName',
	'appId',
	'appName',
	'description',
	'singleInstance',
	{ prop: 'classifications', include: app => !!app.classifications },
	{ path: 'installMetadata.certified', include: app => !!app.installMetadata?.certified },
	{ path: 'installMetadata.maxInstalls', include: app => !!app.installMetadata?.maxInstalls },
	'appType',
	{ path: 'webhookSmartApp.signatureType', include: isWebhookSmartApp },
	{ path: 'webhookSmartApp.targetUrl', include: isWebhookSmartApp },
	{ path: 'webhookSmartApp.targetStatus', include: isWebhookSmartApp },
	{
		label: 'Public Key',
		include: app => !!app.webhookSmartApp?.publicKey,
		value: app => app.webhookSmartApp?.publicKey?.replace(/\r\n/g, '\n') ?? '',
	},
	{
		label: 'Lambda Function',
		include: app => !!app.lambdaSmartApp?.functions,
		value: app => app.lambdaSmartApp?.functions?.join('\n') ?? '',
	},
	{ path: 'apiOnly.subscription.targetUrl', include: hasSubscription },
	{ path: 'apiOnly.subscription.targetStatus', include: hasSubscription },
	{ path: 'installMetadata.certified', include: app => app.installMetadata?.certified !== undefined },
]

export const oauthTableFieldDefinitions: TableFieldDefinition<AppOAuthRequest>[] = ['clientName', 'scope', 'redirectUris']

export const chooseApp =  async (command: APICommand<typeof APICommand.flags>, appFromArg?: string, options?: Partial<ChooseOptions<PagedApp>>): Promise<string> => {
	const opts = chooseOptionsWithDefaults(options)
	const config: SelectFromListConfig<PagedApp> = {
		itemName: 'app',
		primaryKeyName: 'appId',
		sortKeyName: 'displayName',
	}
	const listItems = (): Promise<PagedApp[]> => command.client.apps.list()
	const preselectedId = opts.allowIndex
		? await stringTranslateToId(config, appFromArg, listItems)
		: appFromArg
	return selectFromList(command, config, { preselectedId, listItems })
}

export const buildTableOutput = (tableGenerator: TableGenerator, appSettings: AppSettingsResponse): string => {
	if (!appSettings.settings || Object.keys(appSettings.settings).length === 0) {
		return 'No application settings.'
	}

	const table = tableGenerator.newOutputTable({ head: ['Key', 'Value'] })
	for (const key of Object.keys(appSettings.settings)) {
		table.push([key, appSettings.settings[key]])
	}
	return table.toString()
}

export const verboseApps = async (client: SmartThingsClient, listOptions: AppListOptions): Promise<AppResponse[]> => {
	const apps = await client.apps.list(listOptions)
	return Promise.all(apps.map(app => client.apps.get(app.appId)))
}

export const shortARNorURL = (app: PagedApp & Partial<AppResponse>): string => {
	const uri = (app.webhookSmartApp
		? app.webhookSmartApp.targetUrl
		: (app.lambdaSmartApp
			? (app.lambdaSmartApp.functions?.length ? app.lambdaSmartApp.functions[0] : '')
			: (app.apiOnly?.subscription?.targetUrl))) ?? ''

	return uri.length < 96 ? uri : uri.slice(0, 95) + '...'
}

const availableScopes = [
	'r:devices:*',
	'w:devices:*',
	'x:devices:*',
	'r:hubs:*',
	'r:locations:*',
	'w:locations:*',
	'x:locations:*',
	'r:scenes:*',
	'x:scenes:*',
	'r:rules:*',
	'w:rules:*',
	'r:installedapps',
	'w:installedapps',
]

export const oauthAppScopeDef = checkboxDef<string>('Scopes', availableScopes, {
	helpText: 'More information on OAuth 2 Scopes can be found at:\n' +
	'  https://www.oauth.com/oauth2-servers/scope/\n\n' +
	'To determine which scopes you need for the application, see documentation for the individual endpoints you will use in your app:\n' +
	'  https://developer.smartthings.com/docs/api/public/',
})

const redirectUriHelpText = 'More information on redirect URIs can be found at:\n' +
	'  https://www.oauth.com/oauth2-servers/redirect-uris/'
export const redirectUrisDef = arrayDef(
	'Redirect URIs',
	stringDef('Redirect URI', { validate: localhostOrHTTPSValidate, helpText: redirectUriHelpText }),
	{ minItems: 0, maxItems: 10, helpText: redirectUriHelpText },
)

export const smartAppHelpText = 'More information on writing SmartApps can be found at\n' +
	'  https://developer.smartthings.com/docs/connected-services/smartapp-basics'
