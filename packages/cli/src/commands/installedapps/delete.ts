import { InstalledApp } from '@smartthings/core-sdk'

import { SelectingAPICommand } from '@smartthings/cli-lib'


export default class InstalledAppDeleteCommand extends SelectingAPICommand<InstalledApp> {
	static description = 'delete the installed app instance'

	static flags = SelectingAPICommand.flags

	static args = [{
		name: 'id',
		description: 'installed app UUID',
	}]

	primaryKeyName = 'installedAppId'
	sortKeyName = 'displayName'
	protected listTableFieldDefinitions = ['displayName', 'installedAppType',
		'installedAppStatus', 'installedAppId']

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(InstalledAppDeleteCommand)
		await super.setup(args, argv, flags)

		await this.processNormally(args.id,
			async () => await this.client.installedApps.list(),
			async (id) => { await this.client.installedApps.delete(id) },
			'installed app {{id}} deleted')
	}
}
