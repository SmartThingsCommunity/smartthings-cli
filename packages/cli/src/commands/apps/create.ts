import { AppRequest, AppCreationResponse} from '@smartthings/core-sdk'

import { InputOutputAPICommand } from '@smartthings/cli-lib'

import { buildTableOutput } from '../apps'


export default class AppCreateCommand extends InputOutputAPICommand<AppRequest, AppCreationResponse> {
	static description = 'update the OAuth settings of the app'

	static flags = InputOutputAPICommand.flags

	protected buildTableOutput(data: AppCreationResponse): string {
		return buildTableOutput(this, data.app)
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppCreateCommand)
		await super.setup(args, argv, flags)

		this.processNormally(data => { return this.client.apps.create(data) })
	}
}
