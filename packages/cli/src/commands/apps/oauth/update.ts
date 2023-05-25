import { AppOAuthRequest } from '@smartthings/core-sdk'
import { APICommand, inputAndOutputItem, inputProcessor, objectDef, stringDef, updateFromUserInput } from '@smartthings/cli-lib'
import { chooseApp, oauthAppScopeDef, oauthTableFieldDefinitions, redirectUrisDef } from '../../../lib/commands/apps-util.js'


export default class AppOauthUpdateCommand extends APICommand<typeof AppOauthUpdateCommand.flags> {
	static docNames = 'updateAppOauth'
	static description = 'update the OAuth settings of an app' +
		this.apiDocsURL(AppOauthUpdateCommand.docNames)

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
			description: 'prompt for an app and update its OAuth settings interactively"',
			command: 'smartthings apps:oauth:update',
		},
		{
			description: 'prompt for an app and update its OAuth settings using the data in "oauth-settings.json"',
			command: 'smartthings apps:oauth:update -i oauth-settings.json',
		},
		{
			description: 'update the OAuth settings for the app with the given id using the data in "oauth-settings.json"',
			command: 'smartthings apps:oauth:update 392bcb11-e251-44f3-b58b-17f93015f3aa -i oauth-settings.json',
		},
	]

	async run(): Promise<void> {
		const appId = await chooseApp(this, this.args.id)

		const getInputFromUser = async (): Promise<AppOAuthRequest> => {
			const startingRequest: AppOAuthRequest = await this.client.apps.getOauth(appId)
			const inputDef = objectDef('OAuth Settings', {
				clientName: stringDef('Client Name'),
				scope: oauthAppScopeDef,
				redirectUris: redirectUrisDef,
			}, { helpText: APICommand.itemInputHelpText(AppOauthUpdateCommand.docNames) })

			return updateFromUserInput(this, inputDef, startingRequest, { dryRun: this.flags['dry-run'] })
		}

		await inputAndOutputItem(this, { tableFieldDefinitions: oauthTableFieldDefinitions },
			(_, data: AppOAuthRequest) => this.client.apps.updateOauth(appId, data),
			inputProcessor(() => true, getInputFromUser))
	}
}
