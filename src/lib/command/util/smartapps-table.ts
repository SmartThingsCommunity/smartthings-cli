import {
	type SmartAppOAuthRequest,
	type SmartAppResponse,
	type SmartAppSettingsResponse,
} from '@smartthings/core-sdk'

import { type TableFieldDefinition, type TableGenerator } from '../../table-generator.js'


export const isWebhookSmartApp = (app: SmartAppResponse): boolean => !!app.webhookSmartApp
export const isAPIOnlySmartApp = (app: SmartAppResponse): boolean => !!app.apiOnly
export const hasSubscription = (app: SmartAppResponse): boolean => !!app.apiOnly?.subscription

export const tableFieldDefinitions: TableFieldDefinition<SmartAppResponse>[] = [
	'displayName',
	'appId',
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
	{ path: 'apiOnly.privacyPolicyUrl', include: isAPIOnlySmartApp },
]

export const oauthTableFieldDefinitions: TableFieldDefinition<SmartAppOAuthRequest>[] = [
	'clientName',
	'scope',
	'redirectUris',
	{ prop: 'corsDomains', label: 'CORS Domains' },
]

export const buildTableOutput = (tableGenerator: TableGenerator, appSettings: SmartAppSettingsResponse): string => {
	if (!appSettings.settings || Object.keys(appSettings.settings).length === 0) {
		return 'No application settings.'
	}

	const table = tableGenerator.newOutputTable({ head: ['Key', 'Value'] })
	for (const key of Object.keys(appSettings.settings)) {
		table.push([key, appSettings.settings[key]])
	}
	return table.toString()
}
