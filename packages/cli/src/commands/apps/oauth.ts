import { APICommand, outputItem, outputItemOrList } from '@smartthings/cli-lib'
import { chooseApp, oauthTableFieldDefinitions } from '../../lib/commands/apps-util'


export default class AppOauthCommand extends APICommand<typeof AppOauthCommand.flags> {
	static description = 'get OAuth information for the app'

	static flags = {
		...APICommand.flags,
		...outputItemOrList.flags,
	}

	static args = [{
		name: 'id',
		description: 'the app id or number in the list',
	}]

	async run(): Promise<void> {
		const id = await chooseApp(this, this.args.id, { allowIndex: true })
		await outputItem(this, { tableFieldDefinitions: oauthTableFieldDefinitions }, () => this.client.apps.getOauth(id))
	}
}
