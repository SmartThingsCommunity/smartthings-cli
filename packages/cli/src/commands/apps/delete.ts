import { APICommand } from '@smartthings/cli-lib'
import { chooseApp } from '../../lib/commands/apps/apps-util'


export default class AppDeleteCommand extends APICommand {
	static description = 'delete the app'

	static flags = APICommand.flags

	static args = [{
		name: 'id',
		description: 'App profile UUID or number in the list',
	}]

	async run(): Promise<void> {
		const { args, argv, flags } = await this.parse(AppDeleteCommand)
		await super.setup(args, argv, flags)

		const id = await chooseApp(this, args.id)
		await this.client.apps.delete(id)
		this.log(`App ${id} deleted.`)
	}
}
