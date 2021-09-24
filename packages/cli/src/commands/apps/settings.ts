import { APICommand, CustomCommonOutputProducer, outputItem, outputListing } from '@smartthings/cli-lib'
import { AppSettings } from '@smartthings/core-sdk'
import { buildTableOutput, chooseApp } from '../../lib/commands/apps/apps-util'


export default class AppSettingsCommand extends APICommand {
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
		const { args, argv, flags } = this.parse(AppSettingsCommand)
		await super.setup(args, argv, flags)

		const id = await chooseApp(this, args.id, { allowIndex: true })
		const config: CustomCommonOutputProducer<AppSettings> =
			{ buildTableOutput: appSettings => buildTableOutput(this.tableGenerator, appSettings) }

		await outputItem(this, config, () => this.client.apps.getSettings(id))
	}
}
