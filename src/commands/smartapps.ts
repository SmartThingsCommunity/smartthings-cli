import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import {
	type PagedSmartApp,
	type SmartAppClassification,
	smartAppClassificationValues,
	type SmartAppListOptions,
	type SmartAppResponse,
	type SmartThingsClient,
	type ViewSmartAppType,
	viewSmartAppTypeValues,
} from '@smartthings/core-sdk'

import { forAllOrganizations, type WithOrganization } from '../lib/api-helpers.js'
import { buildEpilog } from '../lib/help.js'
import { type TableFieldDefinition } from '../lib/table-generator.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../lib/command/api-organization-command.js'
import { type AllOrganizationFlags, allOrganizationsBuilder } from '../lib/command/common-flags.js'
import {
	type OutputItemOrListConfig,
	type OutputItemOrListFlags,
	outputItemOrList,
	outputItemOrListBuilder,
} from '../lib/command/listing-io.js'
import { tableFieldDefinitions } from '../lib/command/util/smartapps-table.js'
import {
	paidAccountRequiredHandler,
	shortARNorURL,
	verboseSmartApps,
} from '../lib/command/util/smartapps-util.js'


export type CommandArgs = APIOrganizationCommandFlags & AllOrganizationFlags & OutputItemOrListFlags & {
	type?: ViewSmartAppType
	classification?: SmartAppClassification[]
	verbose: boolean
	idOrIndex?: string
}

type ListedSmartApp = (PagedSmartApp | SmartAppResponse) & Partial<WithOrganization>

const command = 'smartapps [id-or-index]'

const describe = 'get a specific Smart App or a list of Smart Apps'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemOrListBuilder(allOrganizationsBuilder(apiOrganizationCommandBuilder(yargs)))
		.positional('id-or-index', { describe: 'the Smart App id or number from list', type: 'string' })
		.option('type', {
			describe: 'filter results by Smart App type',
			type: 'string',
			choices: viewSmartAppTypeValues,
			coerce: arg => arg.toUpperCase() as ViewSmartAppType,
		})
		.option('classification', {
			describe: 'filter results by one or more classifications',
			type: 'string',
			array: true,
			choices: smartAppClassificationValues,
			coerce: arg => arg?.map((str: string) => str.toUpperCase() as SmartAppClassification),
		})
		.option('verbose',
			{ alias: 'v', describe: 'include URLs and ARNs in table output', type: 'boolean', default: false })
		.example([
			['$0 smartapps', 'list all Smart Apps'],
			[
				'$0 smartapps 1',
				'display details for the first smart app in the list retrieved by running "smartthings smartapps"',
			],
			['$0 smartapps 5dfd6626-ab1d-42da-bb76-90def3153998', 'display details for a Smart App by id'],
			['$0 smartapps --verbose', 'include URLs and ARNs in the output'],
			['$0 smartapps --classification SERVICE', 'list SERVICE classification Smart Apps'],
			['$0 smartapps --type API_ONLY', 'list API-only Smart Apps'],
		])
		.epilog(buildEpilog({ command, apiDocs: ['listSmartApps', 'getSmartApp'] }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const listTableFieldDefinitions: TableFieldDefinition<ListedSmartApp>[] =
		['displayName', 'appType', 'appId']
	if (argv.verbose) {
		listTableFieldDefinitions.push({ label: 'Target URL or ARN', value: shortARNorURL })
	}
	const config: OutputItemOrListConfig<SmartAppResponse, ListedSmartApp> = {
		primaryKeyName: 'appId',
		sortKeyName: 'displayName',
		tableFieldDefinitions,
		listTableFieldDefinitions,
	}

	const listApps = async (): Promise<ListedSmartApp[]> => {
		const appListOptions: SmartAppListOptions = {}

		if (argv.type) {
			appListOptions.appType = argv.type
		}

		if (argv.classification) {
			appListOptions.classification = argv.classification
		}

		const listForClient = (client: SmartThingsClient, accountId?: string): Promise<ListedSmartApp[]> => {
			const options = accountId ? { ...appListOptions, accountId } : appListOptions
			return (argv.verbose ? verboseSmartApps(client, options) : client.smartapps.list(options))
				.catch(paidAccountRequiredHandler('Listing Smart Apps'))
		}

		if (argv.allOrganizations) {
			listTableFieldDefinitions.push('organization')
			return forAllOrganizations(
				command.client,
				(orgClient, org) => listForClient(orgClient, org.organizationId),
			)
		}

		return listForClient(command.client, command.client.config.headers?.['X-ST-Organization'])
	}

	await outputItemOrList(command, config, argv.idOrIndex, listApps, id => command.client.smartapps.get(id))
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
