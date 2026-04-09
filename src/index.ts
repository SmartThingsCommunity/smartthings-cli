import fs from 'node:fs'
import path from 'node:path'

import { AxiosError } from 'axios'
import yargs, { type Argv, type CommandModule } from 'yargs'
import { hideBin } from 'yargs/helpers'


const pkg = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, '..', 'package.json'), 'utf8'))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const buildInstance = (commands: CommandModule<object, any>[]): Argv => {
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
		/* eslint-enable @typescript-eslint/naming-convention */
		.completion('generate-completions-script', 'output completion script setup')
		.fail((message, error, yargs) => {
			if ('isAxiosError' in error && error.isAxiosError) {
				// We don't print axiosError.message here because it just duplicates the things
				// we're displaying but unformatted.
				const axiosError = error as AxiosError
				console.error(`Request to API failed with status ${axiosError.response?.status}`)
				if (axiosError.response) {
					console.error('Response: ', JSON.stringify(axiosError.response.data, null, 4))
				}
			} else if (error) {
				console.error(error.message)
			} else {
				console.error(message)
				console.error(yargs.help())
			}

			// eslint-disable-next-line no-process-exit
			process.exit(1)
		})
	return instance
}
