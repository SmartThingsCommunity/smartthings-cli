import { AppOAuth, AppOAuthResponse } from '@smartthings/core-sdk'

import { InputOutputAPICommand } from '@smartthings/cli-lib'
import { buildTableForOutput } from '../oauth'


export default class AppOauthGenerateCommand extends InputOutputAPICommand<AppOAuth, AppOAuthResponse> {
	static description = 'update the OAuth settings of the app and regenerate the clientId and clientSecret'

	static flags = InputOutputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'the app id',
		required: true,
	}]

	protected primaryKeyName = 'appId'
	protected sortKeyName = 'displayName'

	protected buildTableOutput(appOAuthResponse: AppOAuthResponse): string {
		const table = buildTableForOutput(this, appOAuthResponse)
		table.push(['Client Id', appOAuthResponse.oauthClientId])
		table.push(['Client Secret', appOAuthResponse.oauthClientSecret])
		return table.toString()
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppOauthGenerateCommand)
		await super.setup(args, argv, flags)

		this.processNormally((data) => { return this.client.apps.regenerateOauth(args.id, data) })
	}
}
