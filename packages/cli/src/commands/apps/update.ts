import { flags } from '@oclif/command'
import { App, AppRequest } from '@smartthings/core-sdk'
import { ActionFunction, APICommand, inputAndOutputItem, TableCommonOutputProducer, lambdaAuthFlags } from '@smartthings/cli-lib'
import { addPermission } from '../../lib/aws-utils'
import { chooseApp, tableFieldDefinitions } from '../../lib/commands/apps/apps-util'


export default class AppUpdateCommand extends APICommand {
	static description = 'update the settings of the app'

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
		authorize: flags.boolean({
			description: 'authorize Lambda functions to be called by SmartThings',
		}),
		...lambdaAuthFlags,
	}

	static args = [{
		name: 'id',
		description: 'the app id',
	}]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppUpdateCommand)
		await super.setup(args, argv, flags)

		const appId = await chooseApp(this, args.id)

		const executeUpdate: ActionFunction<void, AppRequest, App> = async (_, data) => {
			if (flags.authorize) {
				if (data.lambdaSmartApp) {
					if (data.lambdaSmartApp.functions) {
						const requests = data.lambdaSmartApp.functions.map((it) => {
							return addPermission(it, flags.principal, flags['statement-id'])
						})
						await Promise.all(requests)
					}
				} else {
					throw new Error('Authorization is not applicable to WebHook SmartApps')
				}
			}
			return this.client.apps.update(appId, data)
		}

		const config: TableCommonOutputProducer<App> = { tableFieldDefinitions }
		await inputAndOutputItem(this, config, executeUpdate)
	}
}
