import { App, AppSettings } from '@smartthings/core-sdk'

import { SelectingInputOutputAPICommand } from '@smartthings/cli-lib'

import { buildTableOutput } from '../settings'


export default class AppSettingsUpdateCommand extends SelectingInputOutputAPICommand<AppSettings, AppSettings, App> {
	static description = 'update the OAuth settings of the app'

	static flags = SelectingInputOutputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'the app id',
	}]

	primaryKeyName = 'appId'
	sortKeyName = 'displayName'

	protected buildTableOutput = buildTableOutput

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppSettingsUpdateCommand)
		await super.setup(args, argv, flags)

		this.processNormally(args.id,
			() => { return this.client.apps.list() },
			async (id, data) => { return this.client.apps.updateSettings(id, data) })
	}
}
