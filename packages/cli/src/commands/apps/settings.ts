import { App, AppSettings } from '@smartthings/core-sdk'
import { ListingOutputAPICommand } from '@smartthings/cli-lib'


export default class AppSettingsCommand extends ListingOutputAPICommand<AppSettings, App> {
	static description = 'get OAuth settings of the app'

	static flags = ListingOutputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'the app id',
		required: true,
	}]

	protected primaryKeyName = 'appId'
	protected sortKeyName = 'displayName'
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
		const { args, argv, flags } = this.parse(AppSettingsCommand)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => { return this.client.apps.list() },
			(id) => { return this.client.apps.getSettings(id) },
		)
	}
}
