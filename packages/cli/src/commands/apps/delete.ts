import { APICommand } from '@smartthings/cli-lib'
import { chooseApp } from '../../lib/commands/apps-util.js'


export default class AppDeleteCommand extends APICommand<typeof AppDeleteCommand.flags> {
	static description = 'delete an app' +
		this.apiDocsURL('deleteApp')

	static flags = APICommand.flags

	static args = [{
		name: 'id',
		description: 'app profile UUID or number in the list',
	}]

	static examples = [
		{ description: 'select app to delete from list', command: 'smartthings apps:delete' },
		{ description: 'delete a specific app by id', command: 'smartthings apps:delete 5dfd6626-ab1d-42da-bb76-90def3153998' },
	]

	async run(): Promise<void> {
		const id = await chooseApp(this, this.args.id)
		await this.client.apps.delete(id)
		this.log(`App ${id} deleted.`)
	}
}
