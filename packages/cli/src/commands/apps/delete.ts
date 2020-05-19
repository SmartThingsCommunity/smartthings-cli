import { SimpleAPICommand } from '@smartthings/cli-lib'


export default class AppDeleteCommand extends SimpleAPICommand {
	static description = 'delete the app'

	static flags = SimpleAPICommand.flags

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

		this.processNormally(`app ${args.id} deleted`,
			async () => { await this.client.apps.delete(args.id) })
	}
}
