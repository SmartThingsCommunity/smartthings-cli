import { App, AppOAuth, AppOAuthResponse } from '@smartthings/core-sdk'
import { ListableObjectInputOutputCommand } from '@smartthings/cli-lib'

export default class AppOauthGenerateCommand extends ListableObjectInputOutputCommand<App, AppOAuthResponse, AppOAuth> {
	static description = 'update the OAuth settings of the app and regenerate the clientId and clientSecret'

	static flags = ListableObjectInputOutputCommand.flags

	static args = [{
		name: 'id',
		description: 'the app id',
		required: true,
	}]

	protected primaryKeyName(): string { return 'appId' }
	protected sortKeyName(): string { return 'displayName' }

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppOauthGenerateCommand)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => { return this.client.apps.list() },
			(id, data) => { return this.client.apps.regenerateOauth(id, data) },
		)
	}
}
