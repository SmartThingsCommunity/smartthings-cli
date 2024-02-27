import { ArgumentsCamelCase, Argv, CommandModule } from 'yargs'

import { AppType, AppClassification, AppListOptions, PagedApp, AppResponse } from '@smartthings/core-sdk'

import { TableFieldDefinition } from '../lib/table-generator.js'
import { APICommandFlags, apiCommand, apiCommandBuilder, apiDocsURL } from '../lib/command/api-command.js'
import { OutputItemOrListConfig, OutputItemOrListFlags, outputItemOrList, outputItemOrListBuilder } from '../lib/command/listing-io.js'
import { shortARNorURL, tableFieldDefinitions, verboseApps } from '../lib/command/util/apps-util.js'


export type CommandArgs = APICommandFlags & OutputItemOrListFlags & {
	type?: AppType
	classification?: AppClassification[]
	verbose: boolean
	idOrIndex?: string
}

const command = 'apps [id-or-index]'

const describe = 'get a specific app or a list of apps'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemOrListBuilder(apiCommandBuilder(yargs))
		.positional('id-or-index', { describe: 'the app id or number from list', type: 'string' })
		.option('type', {
			describe: 'filter results by appType',
			type: 'string',
			choices: Object.values(AppType),
			coerce: arg => arg.toUpperCase() as AppType,
		})
		.option('classification', {
			describe: 'filter results by one or more classifications',
			type: 'string',
			array: true,
			choices: Object.values(AppClassification),
			coerce: arg => arg?.map((str: string) => str.toUpperCase() as AppClassification),
		})
		.option('verbose',
			{ alias: 'v', describe: 'include URLs and ARNs in table output', type: 'boolean', default: false })
		.example([
			['$0 apps', 'list all apps'],
			['$0 apps 1', 'display details for the first app in the list retrieved by running "smartthings apps"'],
			['$0 apps 5dfd6626-ab1d-42da-bb76-90def3153998', 'display details for an app by id'],
			['$0 apps --verbose', 'include URLs and ARNs in the output'],
			['$0 apps --classification SERVICE', 'list SERVICE classification apps'],
			['$0 apps --type API_ONLY', 'list API-only apps'],
		])
		.epilog(apiDocsURL('listApps', 'getApp'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const listTableFieldDefinitions: TableFieldDefinition<PagedApp | AppResponse>[] = ['displayName', 'appType', 'appId']
	if (argv.verbose) {
		listTableFieldDefinitions.push({ label: 'ARN/URL', value: shortARNorURL })
	}
	const config: OutputItemOrListConfig<AppResponse, PagedApp | AppResponse> = {
		primaryKeyName: 'appId',
		sortKeyName: 'displayName',
		tableFieldDefinitions,
		listTableFieldDefinitions,
	}

	const listApps = async (): Promise<PagedApp[] | AppResponse[]> => {
		const appListOptions: AppListOptions = {}
		if (argv.type) {
			appListOptions.appType = AppType[argv.type as keyof typeof AppType]
		}

		if (argv.classification) {
			appListOptions.classification = argv.classification
				.map(classification => AppClassification[classification as keyof typeof AppClassification])
		}

		if (argv.verbose) {
			return verboseApps(command.client, appListOptions)
		}
		return command.client.apps.list(appListOptions)
	}

	await outputItemOrList(command, config, argv.idOrIndex, listApps, id => command.client.apps.get(id))
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
