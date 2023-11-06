import { ArgumentsCamelCase, Argv, CommandModule } from 'yargs'

import { DevicePreference } from '@smartthings/core-sdk'

import { WithOrganization, forAllOrganizations } from '../lib/api-helpers.js'
import { APICommand, APICommandFlags, apiDocsURL } from '../lib/command/api-command.js'
import { APIOrganizationCommandFlags, apiOrganizationCommand, apiOrganizationCommandBuilder } from '../lib/command/api-organization-command.js'
import { AllOrganizationFlags, allOrganizationsBuilder } from '../lib/command/common-flags.js'
import { OutputItemOrListConfig, OutputItemOrListFlags, outputItemOrList, outputItemOrListBuilder } from '../lib/command/listing-io.js'
import { tableFieldDefinitions } from '../lib/command/util/devicepreferences-util.js'
import { TableFieldDefinition } from '../lib/table-generator.js'


export const standardPreferences = async (command: APICommand<APICommandFlags>): Promise<DevicePreference[]> => {
	return (await command.client.devicePreferences.list())
		.filter(preference => preference.preferenceId.split('.').length === 1)
}

export const customPreferences = async (command: APICommand<APICommandFlags>): Promise<DevicePreference[]> => {
	return (await command.client.devicePreferences.list())
		.filter(preference => preference.preferenceId.split('.').length > 1)
}

export async function preferencesForAllOrganizations(command: APICommand<APICommandFlags>): Promise<DevicePreference[]> {
	return forAllOrganizations(command.client, (orgClient, org) => {
		// TODO - Once it is possible to create device preferences in namespaces other than the
		// organization's default one, we should restore this logic
		// return forAllNamespaces(orgClient, (namespace) => {
		// 	return orgClient.devicePreferences.list(namespace.name)
		// })
		return orgClient.devicePreferences.list(org.name)
	})
}


type CommandArgs = APIOrganizationCommandFlags & AllOrganizationFlags & OutputItemOrListFlags & {
	namespace?: string
	standard: boolean
	idOrIndex?: string
}

const command = 'devicepreferences [id-or-index]'

const describe = 'list device preferences or get information for a specific device preference'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemOrListBuilder(allOrganizationsBuilder(apiOrganizationCommandBuilder(yargs)))
		.positional('id-or-index', { describe: 'the device preference id or number from list', type: 'string' })
		.option('namespace', {
			describe: 'a specific namespace to query; will use all by default',
			alias: 'n',
			type: 'string',
		})
		.option('standard', {
			describe: 'show standard SmartThings device preferences',
			alias: 's',
			type: 'boolean',
			default: false,
		})
		.example([
			['$0 devicepreferences', 'list all device preferences'],
			['$0 devicepreferences 2', 'display details for second item listed in the previous command'],
			['$0 devicepreferences motionSensitivity', 'display details for a preference by id'],
			['$0 devicepreferences --standard', 'list standard device preferences'],
		])
		.epilog(apiDocsURL('listPreferences', 'getPreferenceById'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)
	const listTableFieldDefinitions: TableFieldDefinition<DevicePreference & WithOrganization>[] =
		['preferenceId', 'title', 'name', 'description', 'required', 'preferenceType']
	const config: OutputItemOrListConfig<DevicePreference, DevicePreference & WithOrganization> = {
		itemName: 'device preference',
		primaryKeyName: 'preferenceId',
		sortKeyName: 'preferenceId',
		tableFieldDefinitions,
		listTableFieldDefinitions,
	}

	await outputItemOrList(command, config, argv.idOrIndex,
		async () => {
			if (argv.standard) {
				return standardPreferences(command)
			} else if (argv.namespace) {
				return command.client.devicePreferences.list(argv.namespace)
			}
			else if (argv['all-organizations']) {
				listTableFieldDefinitions.push('organization')
				return preferencesForAllOrganizations(command)
			}
			return customPreferences(command)
		},
		id => command.client.devicePreferences.get(id))
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
