import { App, AppOAuth } from '@smartthings/core-sdk'
import { ListableObjectInputOutputCommand } from '@smartthings/cli-lib'

export default class AppOauthUpdateCommand extends ListableObjectInputOutputCommand<App, AppOAuth, AppOAuth> {
	static description = 'update the OAuth settings of the app'

	static flags = ListableObjectInputOutputCommand.flags

	static args = [{
		name: 'id',
		description: 'the app id',
		required: true,
	}]

	protected primaryKeyName(): string { return 'appId' }
	protected sortKeyName(): string { return 'displayName' }

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppOauthUpdateCommand)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => { return this.client.apps.list() },
			(id, data) => { return this.client.apps.updateOauth(id, data) },
		)
	}
}
