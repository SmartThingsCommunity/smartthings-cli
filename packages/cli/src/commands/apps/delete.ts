import { APICommand } from '@smartthings/cli-lib'
import { chooseApp } from '../../lib/commands/apps/apps-util'


export default class AppDeleteCommand extends APICommand<typeof AppDeleteCommand.flags> {
	static description = 'delete the app'

	static flags = APICommand.flags

	static args = [{
		name: 'id',
		description: 'App profile UUID or number in the list',
	}]

	async run(): Promise<void> {
		const id = await chooseApp(this, this.args.id)
		await this.client.apps.delete(id)
		this.log(`App ${id} deleted.`)
	}
}
