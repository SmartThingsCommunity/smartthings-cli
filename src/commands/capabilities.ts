import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type Capability } from '@smartthings/core-sdk'

import { forAllOrganizations, type WithOrganization } from '../lib/api-helpers.js'
import { apiDocsURL } from '../lib/command/api-command.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../lib/command/api-organization-command.js'
import {
	capabilityIdOrIndexBuilder,
	type CapabilityIdOrIndexInputFlags,
} from '../lib/command/capability-flags.js'
import { AllOrganizationFlags, allOrganizationsBuilder } from '../lib/command/common-flags.js'
import {
	outputItemOrListBuilder,
	type OutputItemOrListConfig,
	outputItemOrListGeneric,
	type OutputItemOrListFlags,
} from '../lib/command/listing-io.js'
import { buildTableOutput } from '../lib/command/util/capabilities-table.js'
import {
	type CapabilityId,
	type CapabilitySummaryWithNamespace,
	getCustomByNamespace,
	getStandard,
	translateToId,
} from '../lib/command/util/capabilities-util.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& AllOrganizationFlags
	& OutputItemOrListFlags
	& CapabilityIdOrIndexInputFlags
	& {
		namespace?: string
		standard: boolean
	}

const command = 'capabilities [id-or-index] [capability-version]'

const describe = 'get a specific capability or a list of capabilities'

export const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemOrListBuilder(capabilityIdOrIndexBuilder(allOrganizationsBuilder(
		apiOrganizationCommandBuilder(yargs))),
	)
		.option('namespace', {
			alias: 'n',
			description: 'a specific namespace to query; will use all by default',
			type: 'string',
		})
		.option('standard', {
			alias: 's',
			description: 'show standard SmartThings capabilities',
			type: 'boolean',
			default: false,
		})
		.example([
			['$0 capabilities', 'list capabilities'],
			[
				'$0 capabilities 1',
				'display details for the first capability in the list retrieved by running' +
					' "smartthings capabilities"',
			],
			[
				'$0 capabilities 5dfd6626-ab1d-42da-bb76-90def3153998',
				'display details for a capability by id',
			],
			[
				'$0 capabilities --organization 4b1e82f1-7c0a-4d96-8b1c-5565150f5f66',
				'list capabilities for the specified organization',
			],
			[
				'$0 capabilities --namespace cathappy12345',
				'list capabilities for the specified namespace',
			],
			['$0 capabilities --standard', 'list standard capabilities'],
		])
		.epilog(apiDocsURL('listNamespacedCapabilities', 'listCapabilities', 'getCapability'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const idOrIndex = argv.idOrIndex
		? (argv.capabilityVersion
			? { id: argv.idOrIndex, version: argv.capabilityVersion }
			: argv.idOrIndex)
		: undefined
	const sortKeyName = 'id'
	const config: OutputItemOrListConfig<Capability, CapabilitySummaryWithNamespace & WithOrganization> = {
		primaryKeyName: 'id',
		sortKeyName,
		itemName: 'capability',
		pluralItemName: 'capabilities',
		listTableFieldDefinitions: ['id', 'version', 'status'],
		buildTableOutput: (data: Capability) => buildTableOutput(command.tableGenerator, data),
	}
	const listItems = (): Promise<(CapabilitySummaryWithNamespace & WithOrganization)[]> => {
		if (argv.standard) {
			return getStandard(command.client)
		} else if (argv.allOrganizations) {
			config.listTableFieldDefinitions.push('organization')
			return forAllOrganizations(command.client, orgClient =>
				getCustomByNamespace(orgClient, argv.namespace))
		}
		return getCustomByNamespace(command.client, argv.namespace)
	}
	await outputItemOrListGeneric(command, config, idOrIndex,
		listItems,
		(id: CapabilityId) => command.client.capabilities.get(id.id, id.version),
		(idOrIndex, listFunction) => translateToId(sortKeyName, idOrIndex, listFunction))
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
