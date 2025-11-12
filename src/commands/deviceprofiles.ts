import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type DeviceProfile } from '@smartthings/core-sdk'

import { forAllOrganizations, WithOrganization } from '../lib/api-helpers.js'
import { buildEpilog } from '../lib/help.js'
import { buildTableOutput } from '../lib/command/util/deviceprofiles-util.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../lib/command/api-organization-command.js'
import { AllOrganizationFlags, allOrganizationsBuilder } from '../lib/command/common-flags.js'
import {
	outputItemOrList,
	outputItemOrListBuilder,
	type OutputItemOrListConfig,
	type OutputItemOrListFlags,
} from '../lib/command/listing-io.js'


export type CommandArgs = APIOrganizationCommandFlags & AllOrganizationFlags & OutputItemOrListFlags & {
	verbose: boolean
	idOrIndex?: string
}

const command = 'deviceprofiles [id-or-index]'

const describe = 'get a specific device profile or a list device profiles'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemOrListBuilder(allOrganizationsBuilder(apiOrganizationCommandBuilder(yargs)))
		.positional(
			'id-or-index',
			{ describe: 'the device profile id or number from list', type: 'string' },
		)
		.option(
			'verbose',
			{
				alias: 'v',
				describe: 'include presentationId and manufacturerName in list output',
				type: 'boolean',
				default: false,
			},
		)
		.example([
			['$0 deviceprofiles', 'list all device profiles'],
			[
				'$0 deviceprofiles 2',
				'display details for the second device profile in the list retrieved by running "smartthings deviceprofiles"',
			],
			['$0 deviceprofiles 8bd382bb-07e8-48d3-8b11-5f0b508b1729', 'display details for a device profile by id'],
		])
		.epilog(buildEpilog({ command, apiDocs: ['listDeviceProfiles', 'getDeviceProfile'] }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const config: OutputItemOrListConfig<DeviceProfile & WithOrganization> = {
		primaryKeyName: 'id',
		sortKeyName: 'name',
		listTableFieldDefinitions: ['name', 'status', 'id'],
		buildTableOutput: (data: DeviceProfile) => buildTableOutput(command.tableGenerator, data),
	}

	if (argv.allOrganizations) {
		config.listTableFieldDefinitions = ['name', 'status', 'id', 'organization']
	}

	if (argv.verbose) {
		config.listTableFieldDefinitions.push({
			label: 'Profile Id',
			value: item => item.metadata?.vid ?? '',
		})
		config.listTableFieldDefinitions.push({
			label: 'Manufacturer Name',
			value: item => item.metadata?.mnmn ?? '',
		})
	}

	await outputItemOrList<DeviceProfile & WithOrganization>(
		command,
		config,
		argv.idOrIndex,
		() => argv.allOrganizations
			? forAllOrganizations(command.client, (orgClient) => orgClient.deviceProfiles.list())
			: command.client.deviceProfiles.list(),
		id => command.client.deviceProfiles.get(id),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
