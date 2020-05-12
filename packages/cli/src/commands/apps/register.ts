import { App, Status } from '@smartthings/core-sdk'
import { ListableObjectOutputCommand } from '@smartthings/cli-lib'

export default class AppRegisterCommand extends ListableObjectOutputCommand<App, Status> {
	static description = 'register the app'

	static flags = ListableObjectOutputCommand.flags

	static args = [{
		name: 'id',
		description: 'the app id',
		required: true,
	}]

	protected primaryKeyName(): string { return 'appId' }
	protected sortKeyName(): string { return 'displayName' }

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppRegisterCommand)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => { return this.client.apps.list() },
			(id) => { return this.client.apps.register(id) },
		)
	}
}
