import yaml from 'js-yaml'

import { formatFromFilename, IOFormat, stdoutIsTTY, writeFile } from './io-util'
import { SmartThingsCommandInterface } from './smartthings-command'
import { TableFieldDefinition, TableGenerator } from './table-generator'


export function sort<L>(list: L[], keyName: string): L[] {
	return list.sort((a, b) => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const av = a[keyName].toLowerCase()
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const bv = b[keyName].toLowerCase()
		return av === bv ? 0 : av < bv ? -1 : 1
	})
}

export function calculateOutputFormat(command: SmartThingsCommandInterface, defaultIOFormat?: IOFormat): IOFormat {
	// flags get highest priority...check them first
	if (command.flags.json) {
		return IOFormat.JSON
	}
	if (command.flags.yaml) {
		return IOFormat.YAML
	}
	// if we have an output filename, use that file's extension
	if (command.flags.output) {
		return formatFromFilename(command.flags.output)
	}
	if (defaultIOFormat) {
		return defaultIOFormat
	}
	// if we're writing to the console, use user-friendly output, otherwise default to JSON
	return stdoutIsTTY() ? IOFormat.COMMON : IOFormat.JSON
}

export type OutputFormatter<T> = (data: T) => string

export function jsonFormatter<T>(indent: number): OutputFormatter<T> {
	return (data: T) => JSON.stringify(data, null, indent)
}

export function yamlFormatter<T>(indent: number): OutputFormatter<T> {
	return (data: T) => yaml.safeDump(data, { indent })
}

export function itemTableFormatter<T>(tableGenerator: TableGenerator,
		fieldDefinitions: TableFieldDefinition<T>[]): OutputFormatter<T> {
	return (item: T) => tableGenerator.buildTableFromItem(item, fieldDefinitions)
}

export function listTableFormatter<T>(tableGenerator: TableGenerator,
		fieldDefinitions: TableFieldDefinition<T>[], includeIndex = false): OutputFormatter<T[]> {
	let count = 0
	const tfd = includeIndex ? [{
		label: '#',
		value: () => (++count).toString(),
	}, ...fieldDefinitions] : fieldDefinitions
	return (data: T[]) => {
		count = 0
		return tableGenerator.buildTableFromList(data, tfd)
	}
}


export async function writeOutput(dataStr: string, filename?: string): Promise<void> {
	if (filename) {
		await writeFile(filename, dataStr)
	} else {
		process.stdout.write(dataStr)
		if (!dataStr.endsWith('\n')) {
			process.stdout.write('\n')
		}
	}
}
