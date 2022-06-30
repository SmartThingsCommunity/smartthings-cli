import { GenerateAppOAuthRequest } from '@smartthings/core-sdk'
import { APICommand, inputAndOutputItem } from '@smartthings/cli-lib'
import { chooseApp, oauthTableFieldDefinitions } from '../../../lib/commands/apps-util'


export default class AppOauthGenerateCommand extends APICommand<typeof AppOauthGenerateCommand.flags> {
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
		const appId = await chooseApp(this, this.args.id)
		await inputAndOutputItem(this,
			{ tableFieldDefinitions: oauthTableFieldDefinitions.concat('oauthClientId', 'oauthClientSecret') },
			(_, data: GenerateAppOAuthRequest) => this.client.apps.regenerateOauth(appId, data))
	}
}
