import _ from 'lodash'

import { AppType } from '@smartthings/core-sdk'

import { APICommand, selectFromList } from '@smartthings/cli-lib'


export default class AppRegisterCommand extends APICommand {
	static description = 'Send request to app target URL to confirm existence and authorize lifecycle events'

	static flags = APICommand.flags

	static args = [{
		name: 'id',
		description: 'the app id',
	}]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppRegisterCommand)
		await super.setup(args, argv, flags)

		const config = {
			primaryKeyName: 'appId',
			sortKeyName: 'displayName',
			listTableFieldDefinitions: ['displayName', 'appType', 'appId'],
		}
		const id = await selectFromList(this, config, args.id,
			async () => _.flatten(await Promise.all([
				this.client.apps.list({ appType: AppType.WEBHOOK_SMART_APP }),
				this.client.apps.list({ appType: AppType.API_ONLY }),
			])),
			'Select an app to register.')
		await this.client.apps.register(id),
		this.log(`Registration request sent to app ${id}. Check server log for confirmation URL.`)
	}
}
