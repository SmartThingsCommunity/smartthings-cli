import { AppListOptions, AppResponse, AppSettingsResponse, PagedApp, SmartThingsClient } from '@smartthings/core-sdk'

import {
	APICommand,
	ChooseOptions,
	chooseOptionsWithDefaults,
	selectFromList,
	SelectFromListConfig,
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
	{ prop: 'installMetadata.certified', include: app => !!app.installMetadata?.certified },
	{ prop: 'installMetadata.maxInstalls', include: app => !!app.installMetadata?.maxInstalls },
	'appType',
	{ prop: 'webhookSmartApp.signatureType', include: isWebhookSmartApp },
	{ prop: 'webhookSmartApp.targetUrl', include: isWebhookSmartApp },
	{ prop: 'webhookSmartApp.targetStatus', include: isWebhookSmartApp },
	{
		prop: 'webhookSmartApp.publicKey',
		include: app => !!app.webhookSmartApp?.publicKey,
		value: app => app.webhookSmartApp?.publicKey?.replace(/\r\n/g, '\n') ?? '',
	},
	{
		include: app => !!app.lambdaSmartApp?.functions,
		label: 'Lambda Function',
		value: app => app.lambdaSmartApp?.functions?.join('\n') ?? '',
	},
	{ prop: 'apiOnly.subscription.targetUrl', include: hasSubscription },
	{ prop: 'apiOnly.subscription.targetStatus', include: hasSubscription },
	{ prop: 'installMetadata.certified', include: app => app.installMetadata?.certified !== undefined },
]

export const oauthTableFieldDefinitions = ['clientName', 'scope', 'redirectUris']

export const chooseApp =  async (command: APICommand<typeof APICommand.flags>, appFromArg?: string, options?: Partial<ChooseOptions>): Promise<string> => {
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
