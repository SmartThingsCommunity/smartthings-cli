import { App, AppRequest, AppCreationResponse} from '@smartthings/core-sdk'
import { ListableObjectInputOutputCommand } from '@smartthings/cli-lib'

export default class AppCreateCommand extends ListableObjectInputOutputCommand<App, AppCreationResponse, AppRequest> {
	static description = 'update the OAuth settings of the app'

	static flags = ListableObjectInputOutputCommand.flags

	protected primaryKeyName(): string { return 'appId' }
	protected sortKeyName(): string { return 'displayName' }

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppCreateCommand)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => { return this.client.apps.list() },
			(id, data) => { return this.client.apps.create(data) },
		)
	}
}
