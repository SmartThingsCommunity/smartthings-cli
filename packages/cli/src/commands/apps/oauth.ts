import { App, AppOAuth } from '@smartthings/core-sdk'

import {SelectingOutputAPICommand} from '@smartthings/cli-lib'


export const tableFieldDefinitions = ['clientName', 'scope', 'redirectUris']

export default class AppOauthCommand extends SelectingOutputAPICommand<AppOAuth, App> {
	static description = 'get OAuth settings of the app'

	static flags = SelectingOutputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'the app id or number in the list',
	}]

	primaryKeyName = 'appId'
	sortKeyName = 'displayName'
	acceptIndexId = true

	protected tableFieldDefinitions = tableFieldDefinitions

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppOauthCommand)
		await super.setup(args, argv, flags)

		await this.processNormally(
			args.id,
			() => this.client.apps.list(),
			(id) => this.client.apps.getOauth(id),
		)
	}
}
