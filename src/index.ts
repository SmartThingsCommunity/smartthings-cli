import yargs, { Argv } from 'yargs'
import { hideBin } from 'yargs/helpers'

import { commands } from './commands/index.js'


export const buildInstance = (): Argv => {
	const instance: Argv = yargs(hideBin(process.argv))
	instance
		.scriptName('smartthings')
		.command(commands)
		.strict()
		.demandCommand()
		.wrap(Math.min(160, instance.terminalWidth()))
		.recommendCommands()
		/* eslint-disable @typescript-eslint/naming-convention */
		.updateStrings({
			'Positionals:': 'Arguments:',
			'Options:': 'Flags:',
		})
		.parserConfiguration({
			'greedy-arrays': false,
			'strip-aliased': true,
			'strip-dashed': true,
		})
		/* eslint-enable @typescript-eslint/naming-convention */
	return instance
}
