import { AppOAuth } from '@smartthings/core-sdk'
import { APICommand, inputAndOutputItem } from '@smartthings/cli-lib'
import { chooseApp, oauthTableFieldDefinitions } from '../../../lib/commands/apps/apps-util'


export default class AppOauthUpdateCommand extends APICommand {
	static description = 'update the OAuth settings of the app'

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
	}

	static args = [{
		name: 'id',
		description: 'the app id',
	}]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppOauthUpdateCommand)
		await super.setup(args, argv, flags)

		const appId = await chooseApp(this, args.id)
		await inputAndOutputItem(this, { tableFieldDefinitions: oauthTableFieldDefinitions },
			(_, data: AppOAuth) => this.client.apps.updateOauth(appId, data))
	}
}
