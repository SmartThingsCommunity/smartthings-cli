import { GenerateAppOAuthRequest, GenerateAppOAuthResponse } from '@smartthings/core-sdk'
import { APICommand, inputAndOutputItem, InputAndOutputItemConfig, TableFieldDefinition } from '@smartthings/cli-lib'
import { chooseApp } from '../../../lib/commands/apps-util'


export default class AppOauthGenerateCommand extends APICommand<typeof AppOauthGenerateCommand.flags> {
	static description = 'regenerate the OAuth clientId and clientSecret of an app' +
		this.apiDocsURL('generateAppOauth')

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
			description: 'regenerate the OAuth clientId and clientSecret of the app with the given id',
			command: 'smartthings apps:oauth:generate 392bcb11-e251-44f3-b58b-17f93015f3aa',
		},
	]

	async run(): Promise<void> {
		const appId = await chooseApp(this, this.args.id)
		const tableFieldDefinitions: TableFieldDefinition<GenerateAppOAuthResponse>[] = [
			{ path: 'oauthClientDetails.clientName' },
			{ path: 'oauthClientDetails.scope' },
			{ path: 'oauthClientDetails.redirectUris' },
			'oauthClientId',
			'oauthClientSecret',
		]
		const config: InputAndOutputItemConfig<GenerateAppOAuthResponse> = {
			tableFieldDefinitions,
		}
		await inputAndOutputItem(this, config,
			(_, data: GenerateAppOAuthRequest) => this.client.apps.regenerateOauth(appId, data))
	}
}
