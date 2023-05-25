import { Flags } from '@oclif/core'

import { commonIOFlags } from './input.js'
import { IOFormat } from './io-util.js'
import { calculateOutputFormat, jsonFormatter, OutputFormatter, yamlFormatter } from './output.js'
import { SmartThingsCommandInterface } from './smartthings-command.js'


export function buildOutputFormatter<T extends object>(command: SmartThingsCommandInterface,
		inputFormat?: IOFormat, commonOutputFormatter?: OutputFormatter<T>): OutputFormatter<T> {
	const outputFormat = calculateOutputFormat(command, inputFormat)

	const indent: number | undefined = command.flags.indent || command.cliConfig.profile.indent
	if (outputFormat === IOFormat.COMMON && commonOutputFormatter) {
		return commonOutputFormatter
	}
	if (outputFormat == IOFormat.YAML) {
		return yamlFormatter(indent ?? 2)
	}
	return jsonFormatter(indent ?? 4)
}

export const outputFlags = {
	output: Flags.string({
		char: 'o',
		description: 'specify output file',
		helpGroup: 'common',
	}),
	/* eslint-disable @typescript-eslint/naming-convention */
	'group-rows': Flags.boolean({
		description: 'separate groups of four rows by a line to make long rows easier to follow across the screen',
		hidden: true,
	}),
	'no-group-rows': Flags.boolean({
		description: 'do not separate groups of four rows by a line to make long rows easier to follow across the screen',
		hidden: true,
	}),
	/* eslint-enable @typescript-eslint/naming-convention */
}

buildOutputFormatter.flags = {
	...commonIOFlags,
	...outputFlags,
}
