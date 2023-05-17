import { GenerateAppOAuthRequest, GenerateAppOAuthResponse } from '@smartthings/core-sdk'

import { APICommand, inputAndOutputItem, InputAndOutputItemConfig, inputProcessor, objectDef, stringDef, TableFieldDefinition, updateFromUserInput } from '@smartthings/cli-lib'

import { chooseApp, oauthAppScopeDef } from '../../../lib/commands/apps-util'


export default class AppOauthGenerateCommand extends APICommand<typeof AppOauthGenerateCommand.flags> {
	static docNames = 'generateAppOauth'
	static description = 'regenerate the OAuth clientId and clientSecret of an app' +
		this.apiDocsURL(AppOauthGenerateCommand.docNames)

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
		const getInputFromUser = async (): Promise<GenerateAppOAuthRequest> => {
			const origOauth = await this.client.apps.getOauth(appId)
			const startingRequest: GenerateAppOAuthRequest = {
				clientName: origOauth.clientName,
				scope: origOauth.scope,
			}
			const inputDef = objectDef('Generate Request', {
				clientName: stringDef('Client Name'),
				scope: oauthAppScopeDef,
			}, { helpText: APICommand.itemInputHelpText(AppOauthGenerateCommand.docNames) })

			return updateFromUserInput(this, inputDef, startingRequest, { dryRun: this.flags['dry-run'] })
		}

		await inputAndOutputItem(this, config,
			(_, data: GenerateAppOAuthRequest) => this.client.apps.regenerateOauth(appId, data),
			inputProcessor(() => true, getInputFromUser))
	}
}
