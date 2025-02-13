import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type Rule, type RuleRequest } from '@smartthings/core-sdk'

import {
	apiCommand,
	apiCommandBuilder,
	type APICommandFlags,
	apiDocsURL,
} from '../../lib/command/api-command.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemFlags,
} from '../../lib/command/input-and-output-item.js'
import { chooseLocation } from '../../lib/command/util/locations-util.js'
import { tableFieldDefinitions } from '../../lib/command/util/rules-table.js'


export type CommandArgs =
	& APICommandFlags
	& InputAndOutputItemFlags
	& {
		location?: string
	}

const command = 'rules:create'

const describe = 'create a rule'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiCommandBuilder(yargs))
		.option('location', {
			alias: 'l',
			describe: 'the location for the rule',
			type: 'string',
		})
		.example([
			[
				'$0 rules:create -i my-rule.yaml',
				'create a rule defined in "my-rule.yaml"',
			],
		])
		.epilog(apiDocsURL('createRule'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const locationId = await chooseLocation(command, argv.location)

	await inputAndOutputItem<RuleRequest, Rule>(
		command,
		{ tableFieldDefinitions },
		(_, rule) => command.client.rules.create(rule, locationId),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
