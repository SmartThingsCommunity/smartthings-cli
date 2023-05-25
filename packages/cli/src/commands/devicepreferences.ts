import { Flags } from '@oclif/core'

import { DevicePreference } from '@smartthings/core-sdk'

import {
	APIOrganizationCommand,
	outputItemOrList,
	allOrganizationsFlags,
	forAllOrganizations,
	OutputItemOrListConfig,
	TableFieldDefinition,
	WithOrganization,
} from '@smartthings/cli-lib'

import { tableFieldDefinitions } from '../lib/commands/devicepreferences-util.js'


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
	static description = 'list device preferences or get information for a specific device preference' +
		this.apiDocsURL('listPreferences', 'getPreferenceById')

	static flags = {
		...APIOrganizationCommand.flags,
		...outputItemOrList.flags,
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

	static examples = [
		{
			description: 'list all device preferences, sorted by title',
			command: 'smartthings devicepreferences',
		},
		{
			description: 'display details for preference with specified id',
			command: 'smartthings devicepreferences motionSensitivity',
		},
		{
			description: 'display details for second item in list of preferences when sorted by title',
			command: 'smartthings devicepreferences 2',
		},
		{
			description: 'display details for third preference as YAML',
			command: 'smartthings devicepreferences 3 -y',
		},
		{
			description: 'write details as JSON for third preference to dp.json',
			command: 'smartthings devicepreferences 3 -o dp.json',
		},
	]

	async run(): Promise<void> {
		const listTableFieldDefinitions: TableFieldDefinition<DevicePreference & WithOrganization>[] =
			['preferenceId', 'title', 'name', 'description', 'required', 'preferenceType']
		const config: OutputItemOrListConfig<DevicePreference, DevicePreference & WithOrganization> = {
			itemName: 'device preference',
			primaryKeyName: 'preferenceId',
			sortKeyName: 'preferenceId',
			tableFieldDefinitions,
			listTableFieldDefinitions,
		}

		await outputItemOrList(this, config, this.args.idOrIndex,
			async () => {
				if (this.flags.standard) {
					return standardPreferences(this)
				} else if (this.flags.namespace) {
					return this.client.devicePreferences.list(this.flags.namespace)
				}
				else if (this.flags['all-organizations']) {
					listTableFieldDefinitions.push('organization')
					return preferencesForAllOrganizations(this)
				}
				return customPreferences(this)
			},
			id => this.client.devicePreferences.get(id))
	}
}
