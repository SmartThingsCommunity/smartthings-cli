import { type Argv } from 'yargs'

import { type CLIConfig } from '../cli-config.js'
import { type IOFormat } from '../io-util.js'
import {
	calculateOutputFormat,
	calculateOutputFormatBuilder,
	type CalculateOutputFormatFlags,
	jsonFormatter,
	type OutputFormatter,
	yamlFormatter,
} from './output.js'
import { type SmartThingsCommandFlags } from './smartthings-command.js'


export type BuildOutputFormatterFlags =
	& SmartThingsCommandFlags
	& CalculateOutputFormatFlags
	& {
		indent?: number
		groupRows?: boolean
	}

export const buildOutputFormatterBuilder = <T extends SmartThingsCommandFlags>(yargs: Argv<T>): Argv<T & BuildOutputFormatterFlags> =>
	calculateOutputFormatBuilder(yargs)
		.option('indent', {
			describe: 'specify indentation for formatting JSON or YAML output',
			type: 'number',
			hidden: true,
		})
		.option('group-rows', {
			describe: 'separate groups of four rows by a line to make long rows easier to follow across the screen',
			type: 'boolean',
			hidden: true,
		})

export function buildOutputFormatter<T extends object>(flags: BuildOutputFormatterFlags, cliConfig: CLIConfig,
		inputFormat?: IOFormat, commonOutputFormatter?: OutputFormatter<T>): OutputFormatter<T> {
	const outputFormat = calculateOutputFormat(flags, inputFormat)

	const indent = flags.indent || (cliConfig.profile.indent as number | undefined)
	if (outputFormat === 'common' && commonOutputFormatter) {
		return commonOutputFormatter
	}
	if (outputFormat == 'yaml') {
		return yamlFormatter(indent ?? 2)
	}
	return jsonFormatter(indent ?? 4)
}
