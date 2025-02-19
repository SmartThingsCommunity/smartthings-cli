import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type Rule } from '@smartthings/core-sdk'

import { type WithNamedLocation } from '../lib/api-helpers.js'
import { apiCommand, apiCommandBuilder, APICommandFlags, apiDocsURL } from '../lib/command/api-command.js'
import {
	outputItemOrList,
	outputItemOrListBuilder,
	type OutputItemOrListConfig,
	type OutputItemOrListFlags,
} from '../lib/command/listing-io.js'
import { tableFieldDefinitions } from '../lib/command/util/rules-table.js'
import { getRulesByLocation, getRuleWithLocation } from '../lib/command/util/rules-util.js'


export type CommandArgs =
	& APICommandFlags
	& OutputItemOrListFlags
	& {
		location?: string
		idOrIndex?: string
	}

const command = 'rules [id-or-index]'

const describe = 'get a specific rule or a list of rules'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemOrListBuilder(apiCommandBuilder(yargs))
		.positional('id-or-index', { describe: 'the rule id or number from list', type: 'string' })
		.option('location', {
			alias: 'l',
			describe: 'a specific location to query',
			type: 'string',
		})
		.example([
			['$0 rules', 'list all rules'],
			['$0 rules 1', 'display details for the first rule in the list retrieved by running "smartthings rules"'],
			['$0 rules 5dfd6626-ab1d-42da-bb76-90def3153998', 'display details for an rule by id'],
		])
		.epilog(apiDocsURL('listRules', 'getRule'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const config: OutputItemOrListConfig<Rule & WithNamedLocation> = {
		primaryKeyName: 'id',
		sortKeyName: 'name',
		listTableFieldDefinitions: ['name', 'id', 'locationId', 'location'],
		tableFieldDefinitions,
	}

	await outputItemOrList(
		command,
		config,
		argv.idOrIndex,
		() => getRulesByLocation(command.client, argv.location),
		id => getRuleWithLocation(command.client, id, argv.location),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
