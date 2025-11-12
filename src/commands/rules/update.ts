import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import type { Rule, RuleRequest } from '@smartthings/core-sdk'

import { buildEpilog } from '../../lib/help.js'
import {
	type APICommandFlags,
	apiCommand,
	apiCommandBuilder,
} from '../../lib/command/api-command.js'
import {
	type InputAndOutputItemFlags,
	inputAndOutputItem,
	inputAndOutputItemBuilder,
} from '../../lib/command/input-and-output-item.js'
import { chooseRuleFn } from '../../lib/command/util/rules-choose.js'
import { tableFieldDefinitions } from '../../lib/command/util/rules-table.js'
import { getRuleWithLocation } from '../../lib/command/util/rules-util.js'


export type CommandArgs =
	& APICommandFlags
	& InputAndOutputItemFlags
	& {
		location?: string
		id?: string
	}

const command = 'rules:update [id]'

const describe = 'update a rule'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiCommandBuilder(yargs))
		.positional('id', { describe: 'rule id', type: 'string' })
		.option('location', {
			alias: 'l',
			describe: 'a specific location to query',
			type: 'string',
		})
		.example([
			[
				'$0 rules:update -i my-rule.yaml',
				'prompt for a rule and update it using the data in "my-rule.yaml"',
			],
			[
				'$0 rules:update 392bcb11-e251-44f3-b58b-17f93015f3aa -i my-rule.json',
				'update the rule with the given id using the data in "my-rule.json"',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: ['updateRule'] }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const chooseRule = chooseRuleFn(argv.location)
	const id = await chooseRule(command, argv.id, { promptMessage: 'Select a rule to update.' })

	await inputAndOutputItem<RuleRequest, Rule>(
		command,
		{ tableFieldDefinitions },
		async (_, data) => {
			const rule = await getRuleWithLocation(command.client, id, argv.location)
			return command.client.rules.update(id, data, rule.locationId)
		})
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
