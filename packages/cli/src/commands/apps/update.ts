import { App, AppRequest} from '@smartthings/core-sdk'
import { ListableObjectInputOutputCommand } from '@smartthings/cli-lib'

export default class AppUpdateCommand extends ListableObjectInputOutputCommand<App, App, AppRequest> {
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
		const { args, argv, flags } = this.parse(AppUpdateCommand)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => { return this.client.apps.list() },
			(id, data) => { return this.client.apps.update(id, data) },
		)
	}
}
