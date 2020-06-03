import { App } from '@smartthings/core-sdk'

import { StringSelectingInputAPICommand } from '@smartthings/cli-lib'


export default class AppDeleteCommand extends StringSelectingInputAPICommand<App> {
	static description = 'delete the app'

	static flags = StringSelectingInputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'App profile UUID or number in the list',
	}]

	protected primaryKeyName = 'appId'
	protected sortKeyName = 'displayName'

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppDeleteCommand)
		await super.setup(args, argv, flags)

		this.processNormally(args.id,
			async () => await this.client.apps.list(),
			async (id) => { await this.client.apps.delete(id) },
			'app {{id}} deleted')
	}
}
