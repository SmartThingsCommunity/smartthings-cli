import { flags } from '@oclif/command'
import { AppRequest, AppCreationResponse } from '@smartthings/core-sdk'
import { APICommand, inputAndOutputItem, lambdaAuthFlags } from '@smartthings/cli-lib'
import { addPermission } from '../../lib/aws-utils'
import { CLIError } from '@oclif/errors'
import { tableFieldDefinitions } from '../../lib/commands/apps/apps-util'


export default class AppCreateCommand extends APICommand {
	static description = 'create an app'

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
			// TODO extract this authorization block out to util function and use in ./update.ts as well
			if (flags.authorize) {
				if (data.lambdaSmartApp) {
					if (data.lambdaSmartApp.functions) {
						const requests = data.lambdaSmartApp.functions.map((functionArn) => {
							return addPermission(functionArn, flags.principal, flags['statement-id'])
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
