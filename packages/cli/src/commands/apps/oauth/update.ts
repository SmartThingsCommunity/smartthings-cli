import { AppOAuthRequest } from '@smartthings/core-sdk'
import { APICommand, inputAndOutputItem } from '@smartthings/cli-lib'
import { chooseApp, oauthTableFieldDefinitions } from '../../../lib/commands/apps-util'


export default class AppOauthUpdateCommand extends APICommand<typeof AppOauthUpdateCommand.flags> {
	static description = 'update the OAuth settings of an app' +
		this.apiDocsURL('updateAppOauth')

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
	}

	static args = [{
		name: 'id',
		description: 'the app id',
	}]

	static examples = [
		{
			description: 'update the OAuth settings for the app with the given id using the data in "oauth-settings.json"',
			command: 'smartthings apps:oauth:update 392bcb11-e251-44f3-b58b-17f93015f3aa -i oauth-settings.json',
		},
		{
			description: 'ask for the ID of an app to update and then update it using the data in "oauth-settings.json"',
			command: 'smartthings apps:oauth:update -i oauth-settings.json',
		},
	]

	async run(): Promise<void> {
		const appId = await chooseApp(this, this.args.id)
		await inputAndOutputItem(this, { tableFieldDefinitions: oauthTableFieldDefinitions },
			(_, data: AppOAuthRequest) => this.client.apps.updateOauth(appId, data))
	}
}
