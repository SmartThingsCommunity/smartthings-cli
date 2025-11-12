import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { buildEpilog } from '../../lib/help.js'
import {
	type APICommandFlags,
	apiCommand,
	apiCommandBuilder,
} from '../../lib/command/api-command.js'
import { chooseRuleFn } from '../../lib/command/util/rules-choose.js'
import { getRuleWithLocation } from '../../lib/command/util/rules-util.js'


export type CommandArgs = APICommandFlags & {
	location?: string
	id?: string
}

export const command = 'rules:delete [id]'

const describe = 'delete a rule'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiCommandBuilder(yargs)
		.option('location', { alias: 'l', describe: 'a specific location to query', type: 'string' })
		.positional('id', { describe: 'rule id', type: 'string' })
		.example([
			['$0 rules:delete', 'choose the rule to delete from a list'],
			[
				'$0 rules:delete 43daec4d-f2c6-4bc3-9df7-50ed1012c137',
				'delete the rule with the specified id',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: ['deleteRule'] }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const ruleId = await chooseRuleFn(argv.location)(command, argv.id, { promptMessage: 'Select a rule to delete.' })

	const locationId = argv.location ?? (await getRuleWithLocation(command.client, ruleId)).locationId

	await command.client.rules.delete(ruleId, locationId)
	console.log(`Rule ${ruleId} deleted.`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
