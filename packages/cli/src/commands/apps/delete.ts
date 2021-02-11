import { APICommand, selectFromList } from '@smartthings/cli-lib'


export default class AppDeleteCommand extends APICommand {
	static description = 'delete the app'

	static flags = APICommand.flags

	static args = [{
		name: 'id',
		description: 'App profile UUID or number in the list',
	}]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppDeleteCommand)
		await super.setup(args, argv, flags)

		const config = {
			primaryKeyName: 'appId',
			sortKeyName: 'displayName',
		}
		const id = await selectFromList(this, config, args.id, async () => await this.client.apps.list(),
			'Select an app to delete.')
		await this.client.apps.delete(id)
		this.log(`App ${id} deleted.`)
	}
}
