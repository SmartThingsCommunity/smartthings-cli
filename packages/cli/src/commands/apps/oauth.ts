import { App } from '@smartthings/core-sdk'

import { APICommand, outputItem, outputListing, selectFromList, stringTranslateToId } from '@smartthings/cli-lib'


export const tableFieldDefinitions = ['clientName', 'scope', 'redirectUris']

export default class AppOauthCommand extends APICommand {
	static description = 'get OAuth settings of the app'

	static flags = {
		...APICommand.flags,
		...outputListing.flags,
	}

	static args = [{
		name: 'id',
		description: 'the app id or number in the list',
	}]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppOauthCommand)
		await super.setup(args, argv, flags)

		const config = {
			primaryKeyName: 'appId',
			sortKeyName: 'displayName',
		}
		const listApps = (): Promise<App[]> => this.client.apps.list()

		const preselectedId = await stringTranslateToId(config, args.id, listApps)
		const id = await selectFromList(this, config, preselectedId, listApps, 'Select an app.')
		await outputItem(this, { tableFieldDefinitions }, () => this.client.apps.getOauth(id))
	}
}
