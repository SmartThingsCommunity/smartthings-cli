import { Flags } from '@oclif/core'
import { App, AppType, AppClassification, AppListOptions } from '@smartthings/core-sdk'
import { APICommand, outputListing } from '@smartthings/cli-lib'
import { tableFieldDefinitions } from '../lib/commands/apps/apps-util'


export default class AppsCommand extends APICommand {
	static description = 'get a specific app or a list of apps'

	static flags = {
		...APICommand.flags,
		...outputListing.flags,
		type: Flags.string({
			description: 'filter results by appType, WEBHOOK_SMART_APP, LAMBDA_SMART_APP, API_ONLY',
			multiple: false,
		}),
		classification: Flags.string({
			description: 'filter results by one or more classifications, AUTOMATION, SERVICE, DEVICE, CONNECTED_SERVICE',
			multiple: true,
		}),
		// TODO -- uncomment when implemented
		// tag: Flags.string({
		// 	description: 'filter results by one or more tags, e.g. --tag=industry:energy',
		// 	multiple: true,
		// }),
		verbose: Flags.boolean({
			description: 'include URLs and ARNs in table output',
			char: 'v',
		}),
	}

	static args = [{
		name: 'id',
		description: 'the app id or number from list',
	}]

	async run(): Promise<void> {
		const { args, argv, flags } = await this.parse(AppsCommand)
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
					const apps = list.map(app => {
						// TODO remove assertion when https://github.com/SmartThingsCommunity/smartthings-core-sdk/issues/89 is resolved
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						return this.client.apps.get(app.appId!)
					})
					return Promise.all(apps).then((list: (App & { 'ARN/URL'?: string })[]) => {
						for (const app of list) {
							const uri = (app.webhookSmartApp ?
								app.webhookSmartApp.targetUrl :
								(app.lambdaSmartApp ? (app.lambdaSmartApp?.functions?.length ? app.lambdaSmartApp?.functions[0] : '') :
									(app.apiOnly?.subscription?.targetUrl ?? ''))) ?? ''

							const arnURL = uri.length < 96 ? uri : uri.slice(0, 95) + '...'
							app['ARN/URL'] = arnURL
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
