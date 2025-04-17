import {
	type AppListOptions,
	type AppOAuthRequest,
	type AppResponse,
	type AppSettingsResponse,
	type AppUpdateRequest,
	type PagedApp,
	type SmartThingsClient,
} from '@smartthings/core-sdk'

import { addPermission } from '../../aws-util.js'
import { type TableFieldDefinition, type TableGenerator } from '../../table-generator.js'
import { fatalError } from '../../util.js'
import { type ChooseFunction, createChooseFn } from './util-util.js'


export const isWebhookSmartApp = (app: AppResponse): boolean => !!app.webhookSmartApp
export const hasSubscription = (app: AppResponse): boolean => !!app.apiOnly?.subscription

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
]

export const oauthTableFieldDefinitions: TableFieldDefinition<AppOAuthRequest>[] = [
	'clientName',
	'scope',
	'redirectUris',
]

export const chooseAppFn = (): ChooseFunction<PagedApp> => createChooseFn(
	{
		itemName: 'app',
		primaryKeyName: 'appId',
		sortKeyName: 'displayName',
		listTableFieldDefinitions: ['displayName', 'appType', 'appId'],
	},
	command => command.client.apps.list(),
)

export const chooseApp = chooseAppFn()

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

export const verboseApps = async (
		client: SmartThingsClient,
		listOptions: AppListOptions,
): Promise<AppResponse[]> => {
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

export const authorizeApp = async (
		app: AppUpdateRequest,
		principal: string | undefined,
		statement: string | undefined,
): Promise<void> => {
	if (!app.lambdaSmartApp) {
		return fatalError('Authorization is only applicable to Lambda SmartApps.')
	}

	if (app.lambdaSmartApp.functions) {
		const requests = app.lambdaSmartApp.functions.map((functionArn) => {
			return addPermission(functionArn, principal, statement)
		})
		await Promise.all(requests)
	}
}
