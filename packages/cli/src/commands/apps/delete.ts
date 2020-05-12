import { App, Count } from '@smartthings/core-sdk'
import { ListableObjectOutputCommand } from '@smartthings/cli-lib'

export default class AppDeleteCommand extends ListableObjectOutputCommand<App, Count> {
	static description = 'delete the app'

	static flags = ListableObjectOutputCommand.flags

	static args = [{
		name: 'id',
		description: 'the app id',
		required: true,
	}]

	protected primaryKeyName(): string { return 'appId' }
	protected sortKeyName(): string { return 'displayName' }

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppDeleteCommand)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => { return this.client.apps.list() },
			(id) => { return this.client.apps.delete(id) },
		)
	}
}
