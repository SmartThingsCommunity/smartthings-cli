import { App } from '@smartthings/core-sdk'

import { SelectingAPICommand } from '@smartthings/cli-lib'


export default class AppDeleteCommand extends SelectingAPICommand<App> {
	static description = 'delete the app'

	static flags = SelectingAPICommand.flags

	static args = [{
		name: 'id',
		description: 'App profile UUID or number in the list',
	}]

	primaryKeyName = 'appId'
	sortKeyName = 'displayName'

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppDeleteCommand)
		await super.setup(args, argv, flags)

		await this.processNormally(args.id,
			async () => await this.client.apps.list(),
			async (id) => { await this.client.apps.delete(id) },
			'app {{id}} deleted')
	}
}
