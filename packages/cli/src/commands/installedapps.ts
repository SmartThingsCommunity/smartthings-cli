import { InstalledApp } from '@smartthings/core-sdk'
import { ListingOutputAPICommand } from '@smartthings/cli-lib'
import {flags} from '@oclif/command'


export default class InstalledAppsList extends ListingOutputAPICommand<InstalledApp, InstalledApp> {
	static description = 'get a specific app or a list of apps'

	static flags = {
		...ListingOutputAPICommand.flags,
		verbose: flags.boolean({
			description: 'include location name in table output',
			char: 'v',
		}),
	}

	static args = [{
		name: 'id',
		description: 'the app id',
		required: false,
	}]

	primaryKeyName = 'installedAppId'
	sortKeyName = 'displayName'
	protected tableHeadings(): string[] {
		if (this.flags.verbose) {
			return ['displayName', 'installedAppType', 'installedAppType', 'installedAppId', 'location']
		} else {
			return ['displayName', 'installedAppType', 'installedAppId']
		}
	}

	protected buildObjectTableOutput(data: InstalledApp): string {
		const table = this.newOutputTable({head: ['property','value']})
		table.push(['name', data.displayName])
		table.push(['installedAppId', data.installedAppId])
		table.push(['installedAppType', data.installedAppType])
		table.push(['installedAppStatus', data.installedAppStatus])
		table.push(['singleInstance', data.singleInstance])
		table.push(['appId', data.appId])
		table.push(['locationId', data.locationId])
		if (data.classifications) {
			table.push(['classifications', data.classifications.join('\n')])
		}

		return table.toString()
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(InstalledAppsList)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => {
				if (flags.verbose) {
					return this.client.installedApps.list().then(list => {
						return this.addLocations<InstalledApp>(list)
					})
				} else {
					return this.client.installedApps.list()
				}

			},
			(id: string) => {
				return this.client.installedApps.get(id)
			},
		)
	}
}
