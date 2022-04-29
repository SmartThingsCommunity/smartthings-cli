import { App, AppType } from '@smartthings/core-sdk'
import { APICommand, selectFromList, SelectingConfig } from '@smartthings/cli-lib'


export default class AppRegisterCommand extends APICommand<typeof AppRegisterCommand.flags> {
	static description = 'send request to app target URL to confirm existence and authorize lifecycle events'

	static flags = APICommand.flags

	static args = [{
		name: 'id',
		description: 'the app id',
	}]

	async run(): Promise<void> {
		const config: SelectingConfig<App> = {
			primaryKeyName: 'appId',
			sortKeyName: 'displayName',
			listTableFieldDefinitions: ['displayName', 'appType', 'appId'],
		}
		const id = await selectFromList<App>(this, config, {
			preselectedId: this.args.id,
			listItems: async () => (await Promise.all([
				this.client.apps.list({ appType: AppType.WEBHOOK_SMART_APP }),
				this.client.apps.list({ appType: AppType.API_ONLY }),
			])).flat(),
			promptMessage: 'Select an app to register.',
		})
		await this.client.apps.register(id),
		this.log(`Registration request sent to app ${id}. Check server log for confirmation URL.`)
	}
}
