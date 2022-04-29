import { Flags } from '@oclif/core'
import { DevicePreference } from '@smartthings/core-sdk'
import { APIOrganizationCommand, outputListing, allOrganizationsFlags, forAllOrganizations } from '@smartthings/cli-lib'
import { tableFieldDefinitions } from '../lib/commands/devicepreferences/devicepreferences-util'


export async function standardPreferences(command: APIOrganizationCommand<typeof APIOrganizationCommand.flags>): Promise<DevicePreference[]> {
	return (await command.client.devicePreferences.list())
		.filter(preference => preference.preferenceId.split('.').length === 1)
}

export async function customPreferences(command: APIOrganizationCommand<typeof APIOrganizationCommand.flags>): Promise<DevicePreference[]> {
	return (await command.client.devicePreferences.list())
		.filter(preference => preference.preferenceId.split('.').length > 1)
}

export async function preferencesForAllOrganizations(command: APIOrganizationCommand<typeof APIOrganizationCommand.flags>): Promise<DevicePreference[]> {
	return forAllOrganizations(command.client, (orgClient, org) => {
		// TODO - Once it is possible to create device preferences in namespaces other than the
		// organization's default one, we should restore this logic
		// return forAllNamespaces(orgClient, (namespace) => {
		// 	return orgClient.devicePreferences.list(namespace.name)
		// })
		return orgClient.devicePreferences.list(org.name)
	})
}

export default class DevicePreferencesCommand extends APIOrganizationCommand<typeof DevicePreferencesCommand.flags> {
	static description = 'list device preferences or get information for a specific device preference'

	static flags = {
		...APIOrganizationCommand.flags,
		...outputListing.flags,
		...allOrganizationsFlags,
		namespace: Flags.string({
			char: 'n',
			description: 'a specific namespace to query; will use all by default',
		}),
		standard: Flags.boolean({
			char: 's',
			description: 'show standard SmartThings device preferences',
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
		const config = {
			itemName: 'device preference',
			primaryKeyName: 'preferenceId',
			sortKeyName: 'preferenceId',
			tableFieldDefinitions,
			listTableFieldDefinitions: ['preferenceId', 'title', 'name', 'description',
				'required', 'preferenceType'],
		}

		await outputListing(this, config, this.args.idOrIndex,
			async () => {
				if (this.flags.standard) {
					return standardPreferences(this)
				} else if (this.flags.namespace) {
					return this.client.devicePreferences.list(this.flags.namespace)
				}
				else if (this.flags['all-organizations']) {
					config.listTableFieldDefinitions.push('organization')
					return preferencesForAllOrganizations(this)
				}
				return customPreferences(this)
			},
			id => this.client.devicePreferences.get(id))
	}
}
