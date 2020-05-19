import { flags } from '@oclif/command'

import { App } from '@smartthings/core-sdk'

import { ListableObjectOutputCommand, TableGenerator } from '@smartthings/cli-lib'


export function buildTableOutput(tableGenerator: TableGenerator, data: App): string {
	const table = tableGenerator.newOutputTable({head: ['property','value']})
	table.push(['Name', data.displayName])
	table.push(['App Id', data.appId])
	table.push(['App Name', data.appName])
	table.push(['Description', data.description])
	table.push(['Single Instance', data.singleInstance])
	if (data.classifications) {
		table.push(['Classifications', data.classifications.join('\n')])
	}
	if (data.installMetadata && data.installMetadata.certified) {
		table.push(['Certified', data.installMetadata.certified])
	}
	if (data.installMetadata && data.installMetadata.maxInstalls) {
		table.push(['Nax Installs', data.installMetadata.maxInstalls])
	}
	table.push(['App Type', data.appType])
	if (data.webhookSmartApp) {
		table.push(['Signature Type', data.webhookSmartApp.signatureType])
		table.push(['Target URL', data.webhookSmartApp.targetUrl])
		table.push(['Target Status', data.webhookSmartApp.targetStatus])
	}
	if (data.webhookSmartApp && data.webhookSmartApp.publicKey) {
		table.push(['Public Key', data.webhookSmartApp.publicKey.replace(/\r\n/g, '\n')])
	}
	if (data.lambdaSmartApp && data.lambdaSmartApp.functions) {
		table.push(['Lambda Functions', data.lambdaSmartApp.functions.join('\n')])
	}
	if (data.apiOnly && data.apiOnly.subscription) {
		table.push(['Target URL', data.apiOnly.subscription.targetUrl])
		table.push(['Target Status', data.apiOnly.subscription.targetStatus])
	}
	if (data.installMetadata && data.installMetadata.certified !== undefined) {
		table.push(['Certified', data.installMetadata.certified])
	}

	return table.toString()
}

export default class AppsList extends ListableObjectOutputCommand<App, App> {
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
		description: 'the app id or number from list',
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
		return buildTableOutput(this, data)
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
