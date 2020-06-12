import { AppSettings } from '@smartthings/core-sdk'

import { InputOutputAPICommand } from '@smartthings/cli-lib'

import { buildTableOutput } from '../settings'


export default class AppSettingsUpdateCommand extends InputOutputAPICommand<AppSettings, AppSettings> {
	static description = 'update the OAuth settings of the app'

	static flags = InputOutputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'the app id',
		required: true,
	}]

	protected buildTableOutput = buildTableOutput

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppSettingsUpdateCommand)
		await super.setup(args, argv, flags)

		this.processNormally(appSettings => {
			return this.client.apps.updateSettings(args.id, appSettings)
		})
	}
}
