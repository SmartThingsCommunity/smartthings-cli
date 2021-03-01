import { flags } from '@oclif/command'

import { App, AppType, AppClassification, AppListOptions } from '@smartthings/core-sdk'

import { APICommand, outputListing, selectFromList, stringTranslateToId, TableFieldDefinition } from '@smartthings/cli-lib'


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

export interface ChooseAppOptions {
	allowIndex: boolean
}
export async function chooseApp(command: APICommand, appFromArg?: string, options?: Partial<ChooseAppOptions>): Promise<string> {
	const opts: ChooseAppOptions = {
		allowIndex: false,
		...options,
	}
	const config = {
		itemName: 'app',
		primaryKeyName: 'appId',
		sortKeyName: 'displayName',
	}
	const listApps = (): Promise<App[]> => command.client.apps.list()
	const preselectedId = opts.allowIndex
		? await stringTranslateToId(config, appFromArg, listApps)
		: appFromArg
	return selectFromList(command, config, preselectedId, listApps)
}

export default class AppsCommand extends APICommand {
	static description = 'get a specific app or a list of apps'

	static flags = {
		...APICommand.flags,
		...outputListing.flags,
		type: flags.string({
			description: 'filter results by appType, WEBHOOK_SMART_APP, LAMBDA_SMART_APP, API_ONLY',
			multiple: false,
		}),
		classification: flags.string({
			description: 'filter results by one or more classifications, AUTOMATION, SERVICE, DEVICE, CONNECTED_SERVICE',
			multiple: true,
		}),
		// TODO -- uncomment when implemented
		// tag: flags.string({
		// 	description: 'filter results by one or more tags, e.g. --tag=industry:energy',
		// 	multiple: true,
		// }),
		verbose: flags.boolean({
			description: 'include URLs and ARNs in table output',
			char: 'v',
		}),
	}

	static args = [{
		name: 'id',
		description: 'the app id or number from list',
	}]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppsCommand)
		await super.setup(args, argv, flags)

		const config = {
			primaryKeyName: 'appId',
			sortKeyName: 'displayName',
			tableFieldDefinitions: tableFieldDefinitions,
			listTableFieldDefinitions: ['displayName', 'appType', 'appId'],
		}

		if (flags.verbose) {
			config.listTableFieldDefinitions.push('ARN/URL')
		}

		const listApps = async (): Promise<App[]> => {
			const appListOptions: AppListOptions = {}
			if (flags.type) {
				appListOptions.appType = AppType[flags.type as keyof typeof AppType]
			}
			if (flags.classification) {
				appListOptions.classification = flags.classification.map(it => AppClassification[it as keyof typeof AppClassification])
			}
			// TODO -- uncomment when implemented
			// if (flags.tag) {
			// 	appListOptions.tag = flags.tag.reduce((map: {[key: string]: string}, it) => {
			// 		const pos = it.indexOf(':')
			// 		map[it.slice(0, pos)] = it.slice(pos+1)
			// 		return map
			// 	}, {})
			// }
			if (flags.verbose) {
				return this.client.apps.list(appListOptions).then(list => {
					const objects = list.map(it => {
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						return this.client.apps.get((it.appId)!) // TODO appId should not be optional
					})
					return Promise.all(objects).then((list: (App & { 'ARN/URL'?: string })[]) => {
						for (const item of list) {
							const uri = (item.webhookSmartApp ?
								item.webhookSmartApp.targetUrl :
								(item.lambdaSmartApp ? (item.lambdaSmartApp?.functions?.length ? item.lambdaSmartApp?.functions[0] : '') :
									(item.apiOnly?.subscription?.targetUrl ?? ''))) ?? ''

							const arnURL = uri.length < 96 ? uri : uri.slice(0,95) + '...'
							item['ARN/URL'] = arnURL
						}
						return list
					})
				})
			}
			return this.client.apps.list(appListOptions)
		}

		await outputListing(this, config, args.id, listApps, id => this.client.apps.get(id))
	}
}
