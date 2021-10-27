import { flags } from '@oclif/command'

import { DevicePreference } from '@smartthings/core-sdk'

import { APIOrganizationCommand, outputListing, allOrganizationsFlags, forAllOrganizations,
	selectFromList, TableFieldDefinition } from '@smartthings/cli-lib'


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

export async function chooseDevicePreference(command: APIOrganizationCommand, preferenceFromArg?: string): Promise<string> {
	const config = {
		itemName: 'title',
		primaryKeyName: 'preferenceId',
		sortKeyName: 'preferenceId',
		listTableFieldDefinitions: ['preferenceId', 'title', 'name'],
	}
	return selectFromList(command, config, preferenceFromArg, () => command.client.devicePreferences.list())
}

export async function standardPreferences(command: APIOrganizationCommand): Promise<DevicePreference[]> {
	return (await command.client.devicePreferences.list())
		.filter(preference => preference.preferenceId.split('.').length === 1)
}

export async function customPreferences(command: APIOrganizationCommand): Promise<DevicePreference[]> {
	return (await command.client.devicePreferences.list())
		.filter(preference => preference.preferenceId.split('.').length > 1)
}

export async function preferencesForAllOrganizations(command: APIOrganizationCommand): Promise<DevicePreference[]> {
	return forAllOrganizations(command.client, (org) => {
		const orgClient = command.client.clone({'X-ST-Organization': org.organizationId})
		// TODO - Once it is possible to create device preferences in namespaces other than the
		// organization's default one, we should restore this logic
		// return forAllNamespaces(orgClient, (namespace) => {
		// 	return orgClient.devicePreferences.list(namespace.name)
		// })
		return orgClient.devicePreferences.list(org.name)
	})
}

export default class DevicePreferencesCommand extends APIOrganizationCommand {
	static description = 'list device preferences or get information for a specific device preference'

	static flags = {
		...APIOrganizationCommand.flags,
		...outputListing.flags,
		...allOrganizationsFlags,
		namespace: flags.string({
			char: 'n',
			description: 'a specific namespace to query; will use all by default',
		}),
		standard: flags.boolean({
			char: 's',
			description: 'show standard SmartThings capabilities',
		}),
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
			async () => {
				if (flags.standard) {
					return standardPreferences(this)
				} else if (this.flags.namespace) {
					return this.client.devicePreferences.list(this.flags.namespace)
				}
				else if (flags['all-organizations']) {
					config.listTableFieldDefinitions.push('organization')
					return preferencesForAllOrganizations(this)
				}
				return customPreferences(this)
			},
			id => this.client.devicePreferences.get(id))
	}
}
