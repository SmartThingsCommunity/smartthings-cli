import { APICommand, outputListing } from '@smartthings/cli-lib'
import { tableFieldDefinitions } from '../lib/commands/devicepreferences/devicepreferences-util'


export default class DevicePreferencesCommand extends APICommand {
	static description = 'list device preferences or get information for a specific device preference'

	static flags = {
		...APICommand.flags,
		...outputListing.flags,
	}

	static args = [
		{ name: 'idOrIndex', description: 'device preference id or index' },
	]

	static aliases = ['device-preferences']

	static examples = [
		'$ smartthings devicepreferences                       # list all device preferences, sorted by title',
		'$ smartthings devicepreferences device-preference-id  # display details for preference with specified id',
		'$ smartthings devicepreferences 2                     # display details for second preference when sorted by title',
		'$ smartthings devicepreferences 3 -y                  # display details for third preference as YAML',
		'$ smartthings devicepreferences 3 -o dp.json          # write details as JSON for third preference to dp.json',
	]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DevicePreferencesCommand)
		await super.setup(args, argv, flags)

		const config = {
			itemName: 'device preference',
			primaryKeyName: 'preferenceId',
			sortKeyName: 'preferenceId',
			tableFieldDefinitions,
			listTableFieldDefinitions: ['preferenceId', 'title', 'name', 'description',
				'required', 'preferenceType'],
		}

		await outputListing(this, config, args.idOrIndex,
			() => this.client.devicePreferences.list(),
			id => this.client.devicePreferences.get(id))
	}
}
