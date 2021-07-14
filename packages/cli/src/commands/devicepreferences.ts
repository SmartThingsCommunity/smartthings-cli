import { DevicePreference } from '@smartthings/core-sdk'

import { APICommand, outputListing, selectFromList, TableFieldDefinition } from '@smartthings/cli-lib'


export const tableFieldDefinitions: TableFieldDefinition<DevicePreference>[] = [
	'preferenceId', 'title', 'name', 'description', 'required', 'preferenceType',
	{ prop: 'definition.default', skipEmpty: true },
	{ prop: 'definition.minimum', skipEmpty: true },
	{ prop: 'definition.maximum', skipEmpty: true },
	{ prop: 'definition.minLength', skipEmpty: true },
	{ prop: 'definition.maxLength', skipEmpty: true },
	{ prop: 'definition.stringType', skipEmpty: true },
	{
		prop: 'definition.options',
		skipEmpty: true,
		value: (pref: DevicePreference) => {
			if (pref.preferenceType !== 'enumeration') {
				return undefined
			}
			return Object.entries(pref.definition.options).map(([key, value]) => `${key}: ${value}`).join('\n')
		},
	},
]

export async function chooseDevicePreference(command: APICommand, preferenceFromArg?: string): Promise<string> {
	const config = {
		itemName: 'title',
		primaryKeyName: 'preferenceId',
		sortKeyName: 'preferenceId',
		listTableFieldDefinitions: ['preferenceId', 'title', 'name'],
	}
	return selectFromList(command, config, preferenceFromArg, () => command.client.devicePreferences.list())
}

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
