import { flags } from '@oclif/command'

import { AppRequest, AppCreationResponse} from '@smartthings/core-sdk'

import { InputOutputAPICommand } from '@smartthings/cli-lib'

import { tableFieldDefinitions } from '../apps'
import { addPermission } from '../../lib/aws-utils'
import { lambdaAuthFlags } from '../../lib/common-flags'


export default class AppCreateCommand extends InputOutputAPICommand<AppRequest, AppCreationResponse> {
	static description = 'update the OAuth settings of the app'

	static flags = {
		...InputOutputAPICommand.flags,
		authorize: flags.boolean({
			description: 'authorize Lambda functions to be called by SmartThings',
		}),
		...lambdaAuthFlags,
	}

	protected buildTableOutput(data: AppCreationResponse): string {
		return this.tableGenerator.buildTableFromItem(data.app, tableFieldDefinitions)
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppCreateCommand)
		await super.setup(args, argv, flags)

		this.processNormally(async data => {
			if (flags.authorize) {
				if (data.lambdaSmartApp) {
					if (data.lambdaSmartApp.functions) {
						const requests = data.lambdaSmartApp.functions.map((it) => {
							return addPermission(it, flags.principal, flags['statement-id'])
						})
						await Promise.all(requests)
					}
				} else {
					this.logger.error('Authorization is not applicable to web-hook SmartApps')
					// eslint-disable-next-line no-process-exit
					process.exit(1)
				}
			}
			return this.client.apps.create(data)
		})
	}
}
