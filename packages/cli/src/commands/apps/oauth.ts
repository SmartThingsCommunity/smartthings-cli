import Table from 'cli-table'

import { AppOAuth } from '@smartthings/core-sdk'

import { OutputAPICommand, TableGenerator } from '@smartthings/cli-lib'


export function buildTableForOutput(tableGenerator: TableGenerator, appOAuth: AppOAuth): Table {
	const table = tableGenerator.newOutputTable()
	table.push(['Client Name', appOAuth.clientName])
	table.push(['Scope', appOAuth.scope])
	table.push(['Redirect URIs', appOAuth.redirectUris])
	return table
}

export default class AppOauthCommand extends OutputAPICommand<AppOAuth> {
	static description = 'get OAuth settings of the app'

	static flags = OutputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'the app id',
		required: true,
	}]

	protected primaryKeyName(): string { return 'appId' }
	protected sortKeyName(): string { return 'displayName' }

	protected buildTableOutput(appOAuth: AppOAuth): string {
		const table = buildTableForOutput(this, appOAuth)
		return table.toString()
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppOauthCommand)
		await super.setup(args, argv, flags)

		this.processNormally(() => { return this.client.apps.getOauth(args.id) })
	}
}
