import { Flags } from '@oclif/core'
import { AppUpdateRequest, AppResponse } from '@smartthings/core-sdk'
import { ActionFunction, APICommand, inputAndOutputItem, TableCommonOutputProducer, lambdaAuthFlags } from '@smartthings/cli-lib'
import { addPermission } from '../../lib/aws-utils'
import { chooseApp, tableFieldDefinitions } from '../../lib/commands/apps-util'


export default class AppUpdateCommand extends APICommand<typeof AppUpdateCommand.flags> {
	static description = 'update the settings of the app' +
		this.apiDocsURL('updateApp')

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
		authorize: Flags.boolean({
			description: 'authorize Lambda functions to be called by SmartThings',
		}),
		...lambdaAuthFlags,
	}

	static args = [{
		name: 'id',
		description: 'the app id',
	}]

	static examples = [
		{
			description: 'ask for the ID of an app and update it using the data in "my-app.json"',
			command: 'smartthings apps:update -i  my-app.json',
		},
		{
			description: 'update the app with the given id using the data in "my-app.json"',
			command: 'smartthings apps:update 392bcb11-e251-44f3-b58b-17f93015f3aa -i my-app.json',
		},
		{
			description: 'update the given app using the data in "my-app.json" and then authorize it\n' +
				'(See "smartthings apps:authorize" for more information on authorization.)',
			command: 'smartthings apps:update 392bcb11-e251-44f3-b58b-17f93015f3aa -i my-app.json --authorize',
		},
	]

	async run(): Promise<void> {
		const appId = await chooseApp(this, this.args.id)

		const executeUpdate: ActionFunction<void, AppUpdateRequest, AppResponse> = async (_, data) => {
			if (this.flags.authorize) {
				if (data.lambdaSmartApp) {
					if (data.lambdaSmartApp.functions) {
						const requests = data.lambdaSmartApp.functions.map((it) => {
							return addPermission(it, this.flags.principal, this.flags.statement)
						})
						await Promise.all(requests)
					}
				} else {
					throw new Error('Authorization is not applicable to WebHook SmartApps')
				}
			}
			return this.client.apps.update(appId, data)
		}

		const config: TableCommonOutputProducer<AppResponse> = { tableFieldDefinitions }
		await inputAndOutputItem(this, config, executeUpdate)
	}
}
