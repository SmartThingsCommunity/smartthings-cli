import { AppSettings } from '@smartthings/core-sdk'

import { InputOutputAPICommand } from '@smartthings/cli-lib'


export default class AppSettingsUpdateCommand extends InputOutputAPICommand<AppSettings, AppSettings> {
	static description = 'update the OAuth settings of the app'

	static flags = InputOutputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'the app id',
		required: true,
	}]

	protected buildTableOutput(appSettings: AppSettings): string {
		const table = this.newOutputTable({ head: ['name', 'value'] })
		if (appSettings.settings) {
			for (const key of Object.keys(appSettings.settings)) {
				table.push([key, appSettings.settings[key]])
			}
		}
		return table.toString()
	}
	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppSettingsUpdateCommand)
		await super.setup(args, argv, flags)

		this.processNormally(appSettings => {
			return this.client.apps.updateSettings(args.id, appSettings)
		})
	}
}
