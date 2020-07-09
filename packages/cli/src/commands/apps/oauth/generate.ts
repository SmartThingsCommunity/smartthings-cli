import { App, AppOAuth, AppOAuthResponse } from '@smartthings/core-sdk'

import { SelectingInputOutputAPICommand } from '@smartthings/cli-lib'
import { tableFieldDefinitions } from '../oauth'


export default class AppOauthGenerateCommand extends SelectingInputOutputAPICommand<AppOAuth, AppOAuthResponse, App> {
	static description = 'update the OAuth settings of the app and regenerate the clientId and clientSecret'

	static flags = SelectingInputOutputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'the app id',
	}]

	primaryKeyName = 'appId'
	sortKeyName = 'displayName'

	protected tableFieldDefinitions = tableFieldDefinitions.concat('oauthClientId', 'oauthClientSecret')

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppOauthGenerateCommand)
		await super.setup(args, argv, flags)

		this.processNormally(args.id,
			() => this.client.apps.list(),
			async (id, data) => { return this.client.apps.regenerateOauth(id, data) })
	}
}
