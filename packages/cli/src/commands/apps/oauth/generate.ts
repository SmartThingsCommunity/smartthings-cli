import { AppOAuth } from '@smartthings/core-sdk'

import { APICommand, inputAndOutputItem } from '@smartthings/cli-lib'

import { tableFieldDefinitions } from '../oauth'
import { chooseApp } from '../../apps'


export default class AppOauthGenerateCommand extends APICommand {
	static description = 'update the OAuth settings of the app and regenerate the clientId and clientSecret'

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
			{ tableFieldDefinitions: tableFieldDefinitions.concat('oauthClientId', 'oauthClientSecret') },
			(_, data: AppOAuth) => this.client.apps.regenerateOauth(appId, data))
	}
}
