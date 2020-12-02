import { App, AppOAuth } from '@smartthings/core-sdk'

import { SelectingInputOutputAPICommand } from '@smartthings/cli-lib'

import { tableFieldDefinitions } from '../oauth'


export default class AppOauthUpdateCommand extends SelectingInputOutputAPICommand<AppOAuth, AppOAuth, App> {
	static description = 'update the OAuth settings of the app'

	static flags = SelectingInputOutputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'the app id',
	}]

	primaryKeyName = 'appId'
	sortKeyName = 'displayName'

	protected tableFieldDefinitions = tableFieldDefinitions

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppOauthUpdateCommand)
		await super.setup(args, argv, flags)

		await this.processNormally(args.id,
			() => { return this.client.apps.list() },
			async (id, data) => { return this.client.apps.updateOauth(id, data) })
	}
}
