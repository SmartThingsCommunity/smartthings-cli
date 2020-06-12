import { AppOAuth } from '@smartthings/core-sdk'

import { InputOutputAPICommand } from '@smartthings/cli-lib'

import { tableFieldDefinitions } from '../oauth'


export default class AppOauthUpdateCommand extends InputOutputAPICommand<AppOAuth, AppOAuth> {
	static description = 'update the OAuth settings of the app'

	static flags = InputOutputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'the app id',
		required: true,
	}]

	primaryKeyName = 'appId'
	sortKeyName = 'displayName'

	protected tableFieldDefinitions = tableFieldDefinitions

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppOauthUpdateCommand)
		await super.setup(args, argv, flags)

		this.processNormally((data) => { return this.client.apps.updateOauth(args.id, data) })
	}
}
