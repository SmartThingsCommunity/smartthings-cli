import { App, AppRequest} from '@smartthings/core-sdk'

import { InputOutputAPICommand } from '@smartthings/cli-lib'
import { buildTableOutput } from '../apps'


export default class AppUpdateCommand extends InputOutputAPICommand<AppRequest, App> {
	static description = 'update the OAuth settings of the app'

	static flags = InputOutputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'the app id',
		required: true,
	}]

	protected primaryKeyName = 'appId'
	protected sortKeyName = 'displayName'

	protected buildTableOutput(app: App): string {
		return buildTableOutput(this, app)
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppUpdateCommand)
		await super.setup(args, argv, flags)

		this.processNormally(data => { return this.client.apps.update(args.id, data) })
	}
}
