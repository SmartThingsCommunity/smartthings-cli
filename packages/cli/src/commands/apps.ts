import { Flags } from '@oclif/core'
import { AppType, AppClassification, AppListOptions, PagedApp, AppResponse } from '@smartthings/core-sdk'
import { APICommand, outputItemOrList, OutputItemOrListConfig } from '@smartthings/cli-lib'
import { shortARNorURL, tableFieldDefinitions, verboseApps } from '../lib/commands/apps-util'


export default class AppsCommand extends APICommand<typeof AppsCommand.flags> {
	static description = 'get a specific app or a list of apps'

	static flags = {
		...APICommand.flags,
		...outputItemOrList.flags,
		type: Flags.string({
			description: 'filter results by appType, WEBHOOK_SMART_APP, LAMBDA_SMART_APP, API_ONLY',
			multiple: false,
		}),
		classification: Flags.string({
			description: 'filter results by one or more classifications, AUTOMATION, SERVICE, DEVICE, CONNECTED_SERVICE',
			multiple: true,
		}),
		verbose: Flags.boolean({
			description: 'include URLs and ARNs in table output',
			char: 'v',
		}),
	}

	static args = [{
		name: 'id',
		description: 'the app id or number from list',
	}]

	static examples = [
		{ description: 'list all apps', command: 'smartthings apps' },
		{ description: 'list the first app in the list retrieved by running "smartthings apps"', command: 'smartthings apps 1' },
		{ description: 'list an app by id', command: 'smartthings apps 5dfd6626-ab1d-42da-bb76-90def3153998' },
		{ description: 'include URLs and ARNs in the output', command: 'smartthings apps --verbose' },
		{ description: 'list SERVICE classification apps', command: 'smartthings apps --classification SERVICE' },
		{ description: 'list API-only apps', command: 'smartthings apps --type API_ONLY' },
	]

	async run(): Promise<void> {
		const config: OutputItemOrListConfig<AppResponse, PagedApp | AppResponse> = {
			primaryKeyName: 'appId',
			sortKeyName: 'displayName',
			tableFieldDefinitions,
			listTableFieldDefinitions: ['displayName', 'appType', 'appId'],
		}

		if (this.flags.verbose) {
			config.listTableFieldDefinitions.push({ label: 'ARN/URL', value: shortARNorURL })
		}

		const listApps = async (): Promise<PagedApp[] | AppResponse[]> => {
			const appListOptions: AppListOptions = {}
			if (this.flags.type) {
				appListOptions.appType = AppType[this.flags.type as keyof typeof AppType]
			}

			if (this.flags.classification) {
				appListOptions.classification = this.flags.classification.map(classification => AppClassification[classification as keyof typeof AppClassification])
			}

			if (this.flags.verbose) {
				return verboseApps(this.client, appListOptions)
			}
			return this.client.apps.list(appListOptions)
		}

		await outputItemOrList(this, config, this.args.id, listApps, id => this.client.apps.get(id))
	}
}
