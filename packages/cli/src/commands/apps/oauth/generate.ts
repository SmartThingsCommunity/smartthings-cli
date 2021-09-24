import { AppOAuth } from '@smartthings/core-sdk'
import { APICommand, inputAndOutputItem } from '@smartthings/cli-lib'
import { chooseApp, oauthTableFieldDefinitions } from '../../../lib/commands/apps/apps-util'


export default class AppOauthGenerateCommand extends APICommand {
	static description = 'regenerate the OAuth clientId and clientSecret of an app'

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
	}

	static args = [{
		name: 'id',
		description: 'the app id',
	}]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppOauthGenerateCommand)
		await super.setup(args, argv, flags)

		const appId = await chooseApp(this, args.id)
		await inputAndOutputItem(this,
			{ tableFieldDefinitions: oauthTableFieldDefinitions.concat('oauthClientId', 'oauthClientSecret') },
			(_, data: AppOAuth) => this.client.apps.regenerateOauth(appId, data))
	}
}
