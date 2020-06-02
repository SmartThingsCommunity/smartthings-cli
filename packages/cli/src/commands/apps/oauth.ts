import Table from 'cli-table'

import { App, AppOAuth } from '@smartthings/core-sdk'

import { APICommand, OutputAPICommand, ListingOutputAPICommand } from '@smartthings/cli-lib'


export function buildTableForOutput(this: APICommand, appOAuth: AppOAuth): Table {
	const table = this.newOutputTable()
	table.push(['Client Name', appOAuth.clientName])
	table.push(['Scope', appOAuth.scope])
	table.push(['Redirect URIs', appOAuth.redirectUris])
	return table
}

export default class AppOauthCommand extends ListingOutputAPICommand<AppOAuth, App> {
	static description = 'get OAuth settings of the app'

	static flags = OutputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'the app id or number in the list',
	}]

	primaryKeyName = 'appId'
	sortKeyName = 'displayName'

	protected buildTableForOutput = buildTableForOutput

	protected buildObjectTableOutput(appOAuth: AppOAuth): string {
		const table = this.buildTableForOutput(appOAuth)
		return table.toString()
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppOauthCommand)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => this.client.apps.list(),
			(id) => this.client.apps.getOauth(id),
		)
	}
}
