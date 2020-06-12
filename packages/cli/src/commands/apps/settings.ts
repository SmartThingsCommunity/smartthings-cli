import { App, AppSettings } from '@smartthings/core-sdk'

import { APICommand, ListingOutputAPICommand } from '@smartthings/cli-lib'


export function buildTableOutput(this: APICommand, appSettings: AppSettings): string {
	const table = this.tableGenerator.newOutputTable()
	if (appSettings.settings) {
		for (const key of Object.keys(appSettings.settings)) {
			table.push([key, appSettings.settings[key]])
		}
	}
	return table.toString()
}

export default class AppSettingsCommand extends ListingOutputAPICommand<AppSettings, App> {
	static description = 'get OAuth settings of the app'

	static flags = ListingOutputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'the app id',
		required: true,
	}]

	primaryKeyName = 'appId'
	sortKeyName = 'displayName'

	protected buildTableOutput = buildTableOutput

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppSettingsCommand)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => { return this.client.apps.list() },
			(id) => { return this.client.apps.getSettings(id) },
		)
	}
}
