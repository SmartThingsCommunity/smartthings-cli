import { Flags, Errors } from '@oclif/core'
import { AppCreateRequest, AppCreationResponse } from '@smartthings/core-sdk'
import { APICommand, inputAndOutputItem, lambdaAuthFlags } from '@smartthings/cli-lib'
import { addPermission } from '../../lib/aws-utils'
import { tableFieldDefinitions } from '../../lib/commands/apps-util'


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

	static examples = [
		{ description: 'create an app defined in "my-app.yaml"', command: 'smartthings apps:create -i my-app.yaml' },
		{
			description: 'create an app defined in "my-app.json" and then authorize it\n' +
				'(See "smartthings apps:authorize" for more information on authorization.)',
			command: 'smartthings apps:create -i my-app.json --authorize',
		},
	]

	async run(): Promise<void> {
		const createApp = async (_: void, data: AppCreateRequest): Promise<AppCreationResponse> => {
			// TODO extract this authorization block out to util function and use in ./update.ts as well
			if (this.flags.authorize) {
				if (data.lambdaSmartApp) {
					if (data.lambdaSmartApp.functions) {
						const requests = data.lambdaSmartApp.functions.map((functionArn) => {
							return addPermission(functionArn, this.flags.principal, this.flags.statement)
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
