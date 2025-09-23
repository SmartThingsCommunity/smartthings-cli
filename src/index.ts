import fs from 'node:fs'
import path from 'node:path'

import yargs, { Argv } from 'yargs'
import { hideBin } from 'yargs/helpers'

import { commands } from './commands/index.js'


const pkg = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, '..', 'package.json'), 'utf8'))

export const buildInstance = (): Argv => {
	const instance: Argv = yargs(hideBin(process.argv))
	instance
		.scriptName('smartthings')
		.version(pkg.version)
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
		.completion('generate-completions-script', 'output completion script setup')
		/* eslint-enable @typescript-eslint/naming-convention */
	return instance
}
