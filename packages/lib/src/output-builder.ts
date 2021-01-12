import { flags } from '@oclif/command'

import { commonIOFlags } from './input'
import { IOFormat } from './io-util'
import { calculateOutputFormat, jsonFormatter, OutputFormatter, yamlFormatter } from './output'
import { SmartThingsCommandInterface } from './smartthings-command'


export function buildOutputFormatter<T>(command: SmartThingsCommandInterface,
		inputFormat?: IOFormat, commonOutputFormatter?: OutputFormatter<T>): OutputFormatter<T> {
	const outputFormat = calculateOutputFormat(command, inputFormat)

	const indent: number | undefined = command.flags.indent || command.profileConfig.indent
	if (outputFormat === IOFormat.COMMON && commonOutputFormatter) {
		return commonOutputFormatter
	}
	if (outputFormat == IOFormat.YAML) {
		return yamlFormatter(indent ?? 2)
	}
	return jsonFormatter(indent ?? 4)
}

export const outputFlags = {
	output: flags.string({
		char: 'o',
		description: 'specify output file',
	}),
	compact: flags.boolean({
		description: 'use compact table format with no lines between body rows',
	}),
	expanded: flags.boolean({
		description: 'use expanded table format with a line between each body row',
	}),

}

buildOutputFormatter.flags = {
	...commonIOFlags,
	...outputFlags,
}
