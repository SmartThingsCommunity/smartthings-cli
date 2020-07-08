import { flags } from '@oclif/command'

import { App, AppRequest} from '@smartthings/core-sdk'

import { SelectingInputOutputAPICommand } from '@smartthings/cli-lib'

import { tableFieldDefinitions } from '../apps'
import { addPermission } from '../../lib/aws-utils'


export default class AppUpdateCommand extends SelectingInputOutputAPICommand<AppRequest, App, App> {
	static description = 'update the OAuth settings of the app'

	static flags = {
		...SelectingInputOutputAPICommand.flags,
		authorize: flags.boolean({
			description: 'authorize Lambda functions to be called by SmartThings',
		})}

	static args = [{
		name: 'id',
		description: 'the app id',
	}]

	primaryKeyName = 'appId'
	sortKeyName = 'displayName'

	protected tableFieldDefinitions = tableFieldDefinitions

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppUpdateCommand)
		await super.setup(args, argv, flags)

		this.processNormally(args.id,
			() => { return this.client.apps.list() },
			async (id, data) => {
				if (flags.authorize) {
					if (data.lambdaSmartApp) {
						if (data.lambdaSmartApp.functions) {
							const requests = data.lambdaSmartApp.functions.map((it) => {
								return addPermission(it)
							})
							await Promise.all(requests)
						}
					} else {
						this.logger.error('Authorization is not applicable to web-hook SmartApps')
						// eslint-disable-next-line no-process-exit
						process.exit(1)
					}
				}
				return this.client.apps.update(id, data)
			})
	}
}
