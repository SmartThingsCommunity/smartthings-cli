import { flags } from '@oclif/command'

import { App } from '@smartthings/core-sdk'

import { ListingOutputAPICommand, TableFieldDefinition } from '@smartthings/cli-lib'


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

export default class AppsList extends ListingOutputAPICommand<App, App> {
	static description = 'get a specific app or a list of apps'

	static flags = {
		...ListingOutputAPICommand.flags,
		verbose: flags.boolean({
			description: 'include URLs and ARNs in table output',
			char: 'v',
		}),
	}

	static args = [{
		name: 'id',
		description: 'the app id or number from list',
	}]

	primaryKeyName = 'appId'
	sortKeyName = 'displayName'

	protected tableFieldDefinitions = tableFieldDefinitions
	protected listTableFieldDefinitions = ['displayName', 'appType', 'appId']

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppsList)
		await super.setup(args, argv, flags)

		if (flags.verbose) {
			this.tableFieldDefinitions.push('ARN/URL')
		}

		this.processNormally(
			args.id,
			() => {
				if (flags.verbose) {
					return this.client.apps.list().then(list => {
						const objects = list.map(it => {
							// @ts-ignore
							return this.client.apps.get(it.appId) // TODO appId should not be optional
						})
						return Promise.all(objects).then(list => {
							for (const item of list) {
								const uri = item.webhookSmartApp ?
									item.webhookSmartApp.targetUrl :
									(item.lambdaSmartApp ? (item.lambdaSmartApp?.functions?.length ? item.lambdaSmartApp?.functions[0] : '') :
										(item.apiOnly?.subscription?.targetUrl ?? ''))

								// @ts-ignore
								item['ARN/URL'] = uri.length < 96 ? uri : uri.slice(0,95) + '...'
							}
							return list
						})
					})
				} else {
					return this.client.apps.list()
				}

			},
			(id: string) => {
				return this.client.apps.get(id)
			},
		)
	}
}
