import { App } from '@smartthings/core-sdk'
import {ListableObjectOutputCommand} from '@smartthings/cli-lib'
import {flags} from '@oclif/command'

export default class AppsList extends ListableObjectOutputCommand<App,App> {
	static description = 'get a specific app or a list of apps'

	static flags = {
		...ListableObjectOutputCommand.flags,
		verbose: flags.boolean({
			description: 'include URLs and ARNs in table output',
			char: 'v',
		}),
	}

	static args = [{
		name: 'id',
		description: 'the app id',
		required: false,
	}]

	protected primaryKeyName(): string { return 'appId' }
	protected sortKeyName(): string { return 'displayName' }
	protected tableHeadings(): string[] {
		if (this.flags.verbose) {
			return ['displayName', 'appType', 'appId', 'ARN/URL']
		} else {
			return ['displayName', 'appType', 'appId']
		}
	}

	protected buildObjectTableOutput(data: App): string {
		const table = this.newOutputTable({head: ['property','value']})
		table.push(['name', data.displayName])
		table.push(['appId', data.appId])
		table.push(['appName', data.appName])
		table.push(['description', data.description])
		table.push(['singleInstance', data.singleInstance])
		if (data.classifications) {
			table.push(['classifications', data.classifications.join('\n')])
		}
		if (data.installMetadata && data.installMetadata.certified) {
			table.push(['certified', data.installMetadata.certified])
		}
		if (data.installMetadata && data.installMetadata.maxInstalls) {
			table.push(['maxInstalls', data.installMetadata.maxInstalls])
		}
		table.push(['appType', data.appType])
		if (data.webhookSmartApp) {
			table.push(['signatureType', data.webhookSmartApp.signatureType])
			table.push(['targetUrl', data.webhookSmartApp.targetUrl])
			table.push(['targetStatus', data.webhookSmartApp.targetStatus])
		}
		if (data.webhookSmartApp && data.webhookSmartApp.publicKey) {
			table.push(['publicKey', data.webhookSmartApp.publicKey.replace(/\r\n/g, '\n')])
		}
		if (data.lambdaSmartApp && data.lambdaSmartApp.functions) {
			table.push(['lambda functions', data.lambdaSmartApp.functions.join('\n')])
		}
		if (data.apiOnly && data.apiOnly.subscription) {
			table.push(['targetUrl', data.apiOnly.subscription.targetUrl])
			table.push(['targetStatus', data.apiOnly.subscription.targetStatus])
		}
		if (data.installMetadata && data.installMetadata.certified !== undefined) {
			table.push(['certified', data.installMetadata.certified])
		}

		return table.toString()
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppsList)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => {
				if (flags.verbose) {
					return this.client.apps.list().then(list => {
						const objects = list.map(it => {
							// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
							// @ts-ignore
							return this.client.apps.get(it.appId) // TODO appId should not be optional
						})
						return Promise.all(objects).then(list => {
							for (const item of list) {
								const uri = item.webhookSmartApp ?
									item.webhookSmartApp.targetUrl :
									(item.lambdaSmartApp ? item.lambdaSmartApp.functions[0] :
										(item.apiOnly && item.apiOnly.subscription ?
											item.apiOnly.subscription.targetUrl : ''))

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
