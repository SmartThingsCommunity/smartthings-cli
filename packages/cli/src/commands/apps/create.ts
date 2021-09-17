import { flags } from '@oclif/command'

import { AppRequest, AppCreationResponse } from '@smartthings/core-sdk'

import { APICommand, inputAndOutputItem } from '@smartthings/cli-lib'

import { tableFieldDefinitions } from '../apps'
import { addPermission } from '../../lib/util/aws-utils'
import { lambdaAuthFlags } from '../../lib/common-flags'
import { CLIError } from '@oclif/errors'


export default class AppCreateCommand extends APICommand {
	static description = 'update the OAuth settings of the app'

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
		authorize: flags.boolean({
			description: 'authorize Lambda functions to be called by SmartThings',
		}),
		...lambdaAuthFlags,
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppCreateCommand)
		await super.setup(args, argv, flags)

		const createApp = async (_: void, data: AppRequest): Promise<AppCreationResponse> => {
			if (flags.authorize) {
				if (data.lambdaSmartApp) {
					if (data.lambdaSmartApp.functions) {
						const requests = data.lambdaSmartApp.functions.map((it) => {
							return addPermission(it, flags.principal, flags['statement-id'])
						})
						await Promise.all(requests)
					}
				} else {
					throw new CLIError('Authorization is not applicable to WebHook SmartApps')
				}
			}
			return this.client.apps.create(data)
		}

		await inputAndOutputItem(this,
			{ buildTableOutput: data => this.tableGenerator.buildTableFromItem(data.app, tableFieldDefinitions) },
			createApp)
	}
}
