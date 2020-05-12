import { App, AppOAuth } from '@smartthings/core-sdk'
import { ListableObjectOutputCommand } from '@smartthings/cli-lib'

export default class AppOauthCommand extends ListableObjectOutputCommand<App, AppOAuth> {
	static description = 'get OAuth settings of the app'

	static flags = ListableObjectOutputCommand.flags

	static args = [{
		name: 'id',
		description: 'the app id',
		required: true,
	}]

	protected primaryKeyName(): string { return 'appId' }
	protected sortKeyName(): string { return 'displayName' }

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppOauthCommand)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => { return this.client.apps.list() },
			(id) => { return this.client.apps.getOauth(id) },
		)
	}
}
