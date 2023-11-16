import { writeFile } from 'fs/promises'

import yaml from 'js-yaml'
import { Argv } from 'yargs'

import { formatFromFilename, IOFormat, stdoutIsTTY } from '../io-util.js'
import { TableFieldDefinition, TableGenerator } from '../table-generator.js'


export function sort<L extends object>(list: L[], keyName?: Extract<keyof L, string>): L[] {
	if (!keyName) {
		return list
	}
	return list.sort((a, b) => {
		const av = (a[keyName] as unknown as string).toLowerCase()
		const bv = (b[keyName] as unknown as string).toLowerCase()
		return av === bv ? 0 : av < bv ? -1 : 1
	})
}

export type CalculateOutputFormatFlags = {
	output?: string
	json?: boolean
	yaml?: boolean
}
export const calculateOutputFormatBuilder = <T extends object>(yargs: Argv<T>): Argv<T & CalculateOutputFormatFlags> => yargs
	.option('output', { alias: 'o', describe: 'specify output file', type: 'string' })
	.option('json', { alias: 'j', describe: 'use JSON format of input and/or output', type: 'boolean', conflicts: 'yaml' })
	.option('yaml', { alias: 'y', describe: 'use YAML format of input and/or output', type: 'boolean', conflicts: 'json' })
export function calculateOutputFormat(flags: CalculateOutputFormatFlags, defaultIOFormat?: IOFormat): IOFormat {
	// flags get highest priority...check them first
	if (flags.json) {
		return IOFormat.JSON
	}
	if (flags.yaml) {
		return IOFormat.YAML
	}
	// if we have an output filename, use that file's extension
	if (flags.output) {
		return formatFromFilename(flags.output)
	}
	if (defaultIOFormat) {
		return defaultIOFormat
	}
	// if we're writing to the console, use user-friendly output, otherwise default to JSON
	return stdoutIsTTY() ? IOFormat.COMMON : IOFormat.JSON
}

export type OutputFormatter<T extends object> = (data: T) => string

export function jsonFormatter<T extends object>(indent: number): OutputFormatter<T> {
	return (data: T) => JSON.stringify(data, null, indent)
}

export function yamlFormatter<T extends object>(indent: number): OutputFormatter<T> {
	return (data: T) => yaml.dump(data, { indent })
}

export function itemTableFormatter<T extends object>(tableGenerator: TableGenerator,
		fieldDefinitions: TableFieldDefinition<T>[]): OutputFormatter<T> {
	return (item: T) => tableGenerator.buildTableFromItem(item, fieldDefinitions)
}

export function listTableFormatter<T extends object>(tableGenerator: TableGenerator,
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
