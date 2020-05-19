import { SimpleAPICommand } from '@smartthings/cli-lib'


export default class AppRegisterCommand extends SimpleAPICommand {
	static description = 'register the app'

	static flags = SimpleAPICommand.flags

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

		this.processNormally(`app ${args.id} registered`,
			async () => { await this.client.apps.register(args.id) })
	}
}
