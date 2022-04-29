import { Flags, Errors } from '@oclif/core'
import { AppRequest, AppCreationResponse } from '@smartthings/core-sdk'
import { APICommand, inputAndOutputItem, lambdaAuthFlags } from '@smartthings/cli-lib'
import { addPermission } from '../../lib/aws-utils'
import { tableFieldDefinitions } from '../../lib/commands/apps/apps-util'


export default class AppCreateCommand extends APICommand<typeof AppCreateCommand.flags> {
	static description = 'create an app'

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
		authorize: Flags.boolean({
			description: 'authorize Lambda functions to be called by SmartThings',
		}),
		...lambdaAuthFlags,
	}

	async run(): Promise<void> {
		const createApp = async (_: void, data: AppRequest): Promise<AppCreationResponse> => {
			// TODO extract this authorization block out to util function and use in ./update.ts as well
			if (this.flags.authorize) {
				if (data.lambdaSmartApp) {
					if (data.lambdaSmartApp.functions) {
						const requests = data.lambdaSmartApp.functions.map((functionArn) => {
							return addPermission(functionArn, this.flags.principal, this.flags['statement-id'])
						})
						await Promise.all(requests)
					}
				} else {
					throw new Errors.CLIError('Authorization is not applicable to WebHook SmartApps')
				}
			}
			return this.client.apps.create(data)
		}

		await inputAndOutputItem(this,
			{ buildTableOutput: data => this.tableGenerator.buildTableFromItem(data.app, tableFieldDefinitions) },
			createApp)
	}
}
