import { App, AppSettings } from '@smartthings/core-sdk'
import { ListableObjectInputOutputCommand } from '@smartthings/cli-lib'

export default class AppSettingsUpdateCommand extends ListableObjectInputOutputCommand<App, AppSettings, AppSettings> {
	static description = 'update the OAuth settings of the app'

	static flags = ListableObjectInputOutputCommand.flags

	static args = [{
		name: 'id',
		description: 'the app id',
		required: true,
	}]

	protected primaryKeyName(): string { return 'appId' }
	protected sortKeyName(): string { return 'displayName' }
	protected buildObjectTableOutput(data: AppSettings): string {
		const table = this.newOutputTable({head: ['name','value']})
		if (data.settings) {
			for (const key of Object.keys(data.settings)) {
				table.push([key, data.settings[key]])
			}
		}
		return table.toString()
	}
	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppSettingsUpdateCommand)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => { return this.client.apps.list() },
			(id, data) => { return this.client.apps.updateSettings(id, data) },
		)
	}
}
