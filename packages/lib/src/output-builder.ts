import { commonIOFlags } from './input'
import { outputFlag } from './io-command'
import { formatFromFilename, IOFormat } from './io-util'
import { jsonFormatter, OutputFormatter, yamlFormatter } from './output'
import { SmartThingsCommandInterface } from './smartthings-command'


export function buildOutputFormatter<T>(command: SmartThingsCommandInterface,
		inputFormat?: IOFormat, commonOutputFormatter?: OutputFormatter<T>): OutputFormatter<T> {
	let outputFormat = IOFormat.COMMON
	if (command.flags.json) {
		outputFormat = IOFormat.JSON
	} else if (command.flags.yaml) {
		outputFormat = IOFormat.YAML
	} else if (command.flags.output) {
		outputFormat = formatFromFilename(command.flags.output)
	} else if (inputFormat) {
		outputFormat = inputFormat
	}

	const indent: number | undefined = command.flags.indent
	if (outputFormat === IOFormat.COMMON && commonOutputFormatter) {
		return commonOutputFormatter
	}
	if (outputFormat == IOFormat.YAML) {
		return yamlFormatter(indent ?? 2)
	}
	return jsonFormatter(indent ?? 4)
}

buildOutputFormatter.flags = {
	...commonIOFlags,
	...outputFlag, // TODO: better name; pluralize (currently has conflict)
}
