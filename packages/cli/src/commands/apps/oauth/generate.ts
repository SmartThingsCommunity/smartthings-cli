import { AppOAuth, AppOAuthResponse } from '@smartthings/core-sdk'

import { InputOutputAPICommand } from '@smartthings/cli-lib'
import { tableFieldDefinitions } from '../oauth'


export default class AppOauthGenerateCommand extends InputOutputAPICommand<AppOAuth, AppOAuthResponse> {
	static description = 'update the OAuth settings of the app and regenerate the clientId and clientSecret'

	static flags = InputOutputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'the app id',
		required: true,
	}]

	primaryKeyName = 'appId'
	sortKeyName = 'displayName'

	protected tableFieldDefinitions = tableFieldDefinitions.concat('oauthClientId', 'oauthClientSecret')

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppOauthGenerateCommand)
		await super.setup(args, argv, flags)

		this.processNormally((data) => { return this.client.apps.regenerateOauth(args.id, data) })
	}
}
