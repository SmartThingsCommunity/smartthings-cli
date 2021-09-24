import { AppSettings } from '@smartthings/core-sdk'
import { APICommand, inputAndOutputItem } from '@smartthings/cli-lib'
import { buildTableOutput, chooseApp } from '../../../lib/commands/apps/apps-util'


export default class AppSettingsUpdateCommand extends APICommand {
	static description = 'update the OAuth settings of the app'

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
	}

	static args = [{
		name: 'id',
		description: 'the app id',
	}]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppSettingsUpdateCommand)
		await super.setup(args, argv, flags)

		const appId = await chooseApp(this, args.id)
		await inputAndOutputItem(this,
			{ buildTableOutput: (data: AppSettings) => buildTableOutput(this.tableGenerator, data) },
			(_, data: AppSettings) => this.client.apps.updateSettings(appId, data))
	}
}
