import { AppSettingsRequest, AppSettingsResponse } from '@smartthings/core-sdk'
import { APICommand, inputAndOutputItem } from '@smartthings/cli-lib'
import { buildTableOutput, chooseApp } from '../../../lib/commands/apps-util.js'


export default class AppSettingsUpdateCommand extends APICommand<typeof AppSettingsUpdateCommand.flags> {
	static description = 'update the settings of an app' +
		this.apiDocsURL('updateAppSettings')

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
	}

	static args = [{
		name: 'id',
		description: 'the app id',
	}]

	static examples = [
		{
			description: 'update the settings of the app with the given id using the data in "app-settings.json"',
			command: 'smartthings apps:settings:update 392bcb11-e251-44f3-b58b-17f93015f3aa -i app-settings.json',
		},
		{
			description: 'ask for the ID of an app to update and then update it using the data in "app-settings.json"',
			command: 'smartthings apps:settings:update -i app-settings.json',
		},
	]

	async run(): Promise<void> {
		const appId = await chooseApp(this, this.args.id)
		await inputAndOutputItem(this,
			{ buildTableOutput: (data: AppSettingsResponse) => buildTableOutput(this.tableGenerator, data) },
			(_, data: AppSettingsRequest) => this.client.apps.updateSettings(appId, data))
	}
}
