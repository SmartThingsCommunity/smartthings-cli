import { APICommand, CustomCommonOutputProducer, outputItem, outputListing } from '@smartthings/cli-lib'
import { AppSettingsResponse } from '@smartthings/core-sdk'
import { buildTableOutput, chooseApp } from '../../lib/commands/apps-util'


export default class AppSettingsCommand extends APICommand<typeof AppSettingsCommand.flags> {
	static description = 'get the settings of the app'

	static flags = {
		...APICommand.flags,
		...outputListing.flags,
	}

	static args = [{
		name: 'id',
		description: 'the app id',
	}]

	async run(): Promise<void> {
		const id = await chooseApp(this, this.args.id, { allowIndex: true })
		const config: CustomCommonOutputProducer<AppSettingsResponse> =
			{ buildTableOutput: appSettings => buildTableOutput(this.tableGenerator, appSettings) }

		await outputItem(this, config, () => this.client.apps.getSettings(id))
	}
}
