import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type RuleExecutionResponse } from '@smartthings/core-sdk'

import { buildEpilog } from '../../lib/help.js'
import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../../lib/command/api-command.js'
import { formatAndWriteItem, formatAndWriteItemBuilder, FormatAndWriteItemFlags } from '../../lib/command/format.js'
import { chooseRuleFn } from '../../lib/command/util/rules-choose.js'
import { buildExecuteResponseTableOutput } from '../../lib/command/util/rules-table.js'
import { getRuleWithLocation } from '../../lib/command/util/rules-util.js'


export type CommandArgs =
	& APICommandFlags
	& FormatAndWriteItemFlags
	& {
		location?: string
		id?: string
	}

const command = 'rules:execute [id]'

const describe = 'execute a rule'

export const builder = (yargs: Argv): Argv<CommandArgs> =>
	formatAndWriteItemBuilder(apiCommandBuilder(yargs))
		.positional('id', { describe: 'rule id', type: 'string' })
		.option('location', {
			alias: 'l',
			describe: 'include only rules from the specified location when prompting',
			type: 'string',
		})
		.example([
			[
				'$0 rules:execute',
				'prompt for a rule to execute and then execute it',
			],
			[
				'$0 rules:execute 699c7308-8c72-4363-9571-880d0f5cc725',
				'execute the rule with the specified id',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: ['executeRule'] }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const chooseRule = chooseRuleFn(argv.location)
	const ruleId = await chooseRule(command, argv.id, { promptMessage: 'Select a rule to execute.' })

	const locationId = argv.location ?? (await getRuleWithLocation(command.client, ruleId, argv.location)).locationId

	const result = await command.client.rules.execute(ruleId, locationId)
	await formatAndWriteItem<RuleExecutionResponse>(
		command,
		{ buildTableOutput: data => buildExecuteResponseTableOutput(command.tableGenerator, data) },
		result,
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
