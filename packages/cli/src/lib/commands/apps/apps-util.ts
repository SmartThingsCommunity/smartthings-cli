import { APICommand, ChooseOptions, chooseOptionsWithDefaults, selectFromList, SelectingConfig, stringTranslateToId, TableFieldDefinition, TableGenerator } from '@smartthings/cli-lib'
import { App, AppSettings } from '@smartthings/core-sdk'


const isWebhookSmartApp = (app: App): boolean => !!app.webhookSmartApp
const hasSubscription = (app: App): boolean => !!app.apiOnly?.subscription

export const tableFieldDefinitions: TableFieldDefinition<App>[] = [
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

export async function chooseApp(command: APICommand, appFromArg?: string, options?: Partial<ChooseOptions>): Promise<string> {
	const opts = chooseOptionsWithDefaults(options)
	const config: SelectingConfig<App> = {
		itemName: 'app',
		primaryKeyName: 'appId',
		sortKeyName: 'displayName',
	}
	const listItems = (): Promise<App[]> => command.client.apps.list()
	const preselectedId = opts.allowIndex
		? await stringTranslateToId(config, appFromArg, listItems)
		: appFromArg
	return selectFromList(command, config, { preselectedId, listItems })
}

export function buildTableOutput(tableGenerator: TableGenerator, appSettings: AppSettings): string {
	if (!appSettings.settings || Object.keys(appSettings.settings).length === 0) {
		return 'No application settings.'
	}

	const table = tableGenerator.newOutputTable({ head: ['Key', 'Value'] })
	if (appSettings.settings) {
		for (const key of Object.keys(appSettings.settings)) {
			table.push([key, appSettings.settings[key]])
		}
	}
	return table.toString()
}
