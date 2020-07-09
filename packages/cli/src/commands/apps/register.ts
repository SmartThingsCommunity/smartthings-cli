import { App } from '@smartthings/core-sdk'

import {SelectingAPICommand} from '@smartthings/cli-lib'


export default class AppRegisterCommand extends SelectingAPICommand<App> {
	static description = 'register the app'

	static flags = SelectingAPICommand.flags

	static args = [{
		name: 'id',
		description: 'the app id',
	}]

	primaryKeyName = 'appId'
	sortKeyName = 'displayName'

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppRegisterCommand)
		await super.setup(args, argv, flags)

		this.processNormally(args.id,
			async () => await this.client.apps.list(),
			async (id) => { await this.client.apps.register(id) },
			'app {{id}} registered')
	}
}
