import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import {
	type DeviceProfileTranslations,
	type LocaleReference,
} from '@smartthings/core-sdk'

import { type WithLocales } from '../../lib/api-helpers.js'
import { apiDocsURL } from '../../lib/command/api-command.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../lib/command/api-organization-command.js'
import { capabilityIdOrIndexBuilder, type CapabilityIdOrIndexInputFlags } from '../../lib/command/capability-flags.js'
import {
	outputItemOrList,
	outputItemOrListBuilder,
	type OutputItemOrListConfig,
	type OutputItemOrListFlags,
} from '../../lib/command/listing-io.js'
import { chooseCapability } from '../../lib/command/util/capabilities-choose.js'
import { buildTableOutput } from '../../lib/command/util/capabilities-translations-table.js'
import { type CapabilitySummaryWithNamespace } from '../../lib/command/util/capabilities-util.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& OutputItemOrListFlags
	& CapabilityIdOrIndexInputFlags
	& {
		namespace?: string
		verbose: boolean
		tag?: string
	}

const command = 'capabilities:translations [id-or-index] [tag]'

const describe = 'get list of locales supported by the capability'

export const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemOrListBuilder(capabilityIdOrIndexBuilder(apiOrganizationCommandBuilder(yargs)))
		.option('namespace', {
			alias: 'n',
			description: 'a specific namespace to query; will use all by default',
			type: 'string',
		})
		.option('verbose', {
			alias: 'v',
			description: 'include list of supported locales in table output',
			type: 'boolean',
			default: false,
		})
		.positional('tag', { desc: 'the locale tag', type: 'string' })
		.example([
			['$0 capabilities:translations', 'prompt for a capability and list its translations'],
			[
				'$0 capabilities:translations --verbose',
				'prompt for a capability and list its translations, includes supported locales in capability list',
			],
			[
				'$0 capabilities:translations 1',
				'list translations for the first capability in the list retrieved by running' +
					' "smartthings capabilities"',
			],
			[
				'$0 capabilities:translations cathappy12345.myCapability',
				'list translations for the specified capability',
			],
			[
				'$0 capabilities:translations 12 es',
				'display details of Spanish translation for twelfth capability retrieved by running' +
					' "smartthings capabilities"',
			],
		])
		.epilog(apiDocsURL('listCapabilityLocalizations', 'getCapabilityLocalization'))

export type CapabilitySummaryWithLocales = CapabilitySummaryWithNamespace & WithLocales

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const capabilityId = await chooseCapability(
		command,
		argv.idOrIndex,
		argv.capabilityVersion,
		{ namespace: argv.namespace, allowIndex: true, verbose: argv.verbose },
	)

	const config: OutputItemOrListConfig<DeviceProfileTranslations, LocaleReference> = {
		primaryKeyName: 'tag',
		sortKeyName: 'tag',
		listTableFieldDefinitions: ['tag'],
		buildTableOutput: data => buildTableOutput(command.tableGenerator, data),
	}

	await outputItemOrList(
		command,
		config,
		argv.tag,
		() => command.client.capabilities.listLocales(capabilityId.id, capabilityId.version),
		tag => command.client.capabilities.getTranslations(capabilityId.id, capabilityId.version, tag),
		true,
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
