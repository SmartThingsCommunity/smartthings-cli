import { InstalledApp } from '@smartthings/core-sdk'

import { SelectingInputAPICommand } from '@smartthings/cli-lib'


export default class InstalledAppDeleteCommand extends SelectingInputAPICommand<InstalledApp> {
	static description = 'delete the installed app instance'

	static flags = SelectingInputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'InstalledApp UUID or number in the list',
	}]

	primaryKeyName = 'installedAppId'
	sortKeyName = 'displayName'
	protected tableHeadings(): string[] {
		return ['displayName', 'installedAppType', 'installedAppStatus', 'installedAppId']
	}
	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(InstalledAppDeleteCommand)
		await super.setup(args, argv, flags)

		this.processNormally(args.id,
			async () => await this.client.installedApps.list(),
			async (id) => { await this.client.installedApps.delete(id) },
			'installed app {{id}} deleted')
	}
}
