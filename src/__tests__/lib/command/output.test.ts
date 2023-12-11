import { jest } from '@jest/globals'

import { writeFile } from 'fs/promises'

import { formatFromFilename, stdoutIsTTY } from '../../../lib/io-util.js'
import { Table, TableFieldDefinition, TableGenerator, TableOptions, ValueTableFieldDefinition } from '../../../lib/table-generator.js'

import { SimpleType } from '../../test-lib/simple-type.js'


const writeFileMock: jest.Mock<typeof writeFile> = jest.fn()
jest.unstable_mockModule('fs/promises', () => ({
	writeFile: writeFileMock,
}))

const formatFromFilenameMock: jest.Mock<typeof formatFromFilename> = jest.fn()
const stdoutIsTTYMock: jest.Mock<typeof stdoutIsTTY> = jest.fn()
jest.unstable_mockModule('../../../lib/io-util.js', () => ({
	formatFromFilename: formatFromFilenameMock,
	stdoutIsTTY: stdoutIsTTYMock,
}))

const newOutputTableMock: jest.Mock<(options?: Partial<TableOptions>) => Table> = jest.fn()
const buildTableFromItemMock: jest.Mock<(item: object, tableFieldDefinitions: TableFieldDefinition<object>[]) => string> = jest.fn()
const buildTableFromListMock: jest.Mock<(items: object[], tableFieldDefinitions: TableFieldDefinition<object>[]) => string> = jest.fn()
const tableGeneratorMock: TableGenerator = {
	newOutputTable: newOutputTableMock,
	buildTableFromItem: buildTableFromItemMock,
	buildTableFromList: buildTableFromListMock,
}


const {
	calculateOutputFormat,
	itemTableFormatter,
	jsonFormatter,
	listTableFormatter,
	sort,
	writeOutput,
	yamlFormatter,
} = await import('../../../lib/command/output.js')


describe('sort', () => {
	it('returns list unsorted when no `keyName` specified', () => {
		const input: SimpleType[] = [{ str: 'a string', num: 5 }]
		const result = sort(input)
		expect(result).toBe(input)
	})

	it('handles an empty array', () => {
		const input: SimpleType[] = []
		const result = sort(input, 'str')
		expect(result).toEqual([])
	})

	it('sorts in a case insensitive manner', () => {
		const st = (str: string): SimpleType => ({ str, num: 1 })
		const input: SimpleType[] = [ st('xyz'), st('abc'), st('ABC'), st('this'), st('that') ]
		const result = sort(input, 'str')
		expect(result).toEqual([st('abc'), st('ABC'), st('that'), st('this'), st('xyz')])
	})
})

describe('calculateOutputFormat', () => {
	it('returns json when specified', () => {
		const flags = { json: true }

		expect(calculateOutputFormat(flags)).toBe('json')
	})

	it('uses yaml when specified', () => {
		const flags = { yaml: true }

		expect(calculateOutputFormat(flags)).toBe('yaml')
	})

	it('gets format using formatFromFilename with output file when not specified', () => {
		const flags = { output: 'fn.json' }
		formatFromFilenameMock.mockReturnValue('json')

		expect(calculateOutputFormat(flags)).toBe('json')

		expect(formatFromFilenameMock).toHaveBeenCalledTimes(1)
		expect(formatFromFilenameMock).toHaveBeenCalledWith('fn.json')
	})

	it('defaults to specified default format', () => {
		expect(calculateOutputFormat({}, 'yaml')).toBe('yaml')
	})

	it('falls back to common in console with no other default specified', () => {
		stdoutIsTTYMock.mockReturnValue(true)

		expect(calculateOutputFormat({})).toBe('common')
		expect(stdoutIsTTYMock).toHaveBeenCalledTimes(1)
	})

	it('falls back to JSON with no other default specified and not outputting to the console', () => {
		stdoutIsTTYMock.mockReturnValue(false)

		expect(calculateOutputFormat({})).toBe('json')
		expect(stdoutIsTTYMock).toHaveBeenCalledTimes(1)
	})
})

describe('simple formatters', () => {
	// These could mock the relatively simple functions they call but it's simpler to it this
	// way and I don't think we gain much from doing that.
	it('jsonFormatter', () => {
		expect(jsonFormatter(2)({ a: 'a_val', b: 2 })).toContain('\n  "a": "a_val')
	})

	it('yamlFormatter', () => {
		expect(yamlFormatter(2)({ a: 'a_val', b: 2 })).toContain('a: a_val')
	})
})

describe('itemTableFormatter', () => {
	it('returns function that calls tableGenerator.buildTableFromItem', () => {
		const fieldDefinitions: TableFieldDefinition<SimpleType>[] = ['str', 'num']
		const formatter = itemTableFormatter(tableGeneratorMock, fieldDefinitions)

		const expected = 'expected result'
		buildTableFromItemMock.mockReturnValue(expected)

		const item: SimpleType = { str: 'string', num: 5 }

		const result = formatter(item)

		expect(result).toBe(expected)
		expect(buildTableFromItemMock).toHaveBeenCalledTimes(1)
		expect(buildTableFromItemMock).toHaveBeenCalledWith(item, fieldDefinitions)
	})
})

describe('listTableFormatter', () => {
	const fieldDefinitions: TableFieldDefinition<SimpleType>[] = ['str', 'num']
	const expected = 'expected result'

	const list: SimpleType[] = [{ str: 'string1', num: 4 }, { str: 'string2', num: 5 }, { str: 'string3', num: 6 }]

	it('returns function that calls tableGenerator.buildTableFromList', () => {
		const formatter = listTableFormatter(tableGeneratorMock, fieldDefinitions)

		buildTableFromListMock.mockReturnValue(expected)

		const result = formatter(list)

		expect(result).toBe(expected)
		expect(buildTableFromListMock).toHaveBeenCalledTimes(1)
		expect(buildTableFromListMock).toHaveBeenCalledWith(list, fieldDefinitions)
	})

	it('handles includeIndex', () => {
		const formatter = listTableFormatter(tableGeneratorMock, fieldDefinitions, /* includeIndex */ true)
		buildTableFromListMock.mockReturnValueOnce('formatted table 1')
		buildTableFromListMock.mockReturnValueOnce('formatted table 2')

		expect(formatter(list)).toBe('formatted table 1')

		expect(buildTableFromListMock).toHaveBeenCalledTimes(1)
		const table1LabelFieldDefinition = buildTableFromListMock.mock.calls[0][1][0] as ValueTableFieldDefinition<object>
		expect(table1LabelFieldDefinition.label).toBe('#')
		const valueFunction1 = table1LabelFieldDefinition.value
		expect(valueFunction1({})).toBe('1')
		expect(valueFunction1({})).toBe('2')
		expect(valueFunction1({})).toBe('3')

		// Ensure `value` starts over at 1 the second time if we call twice.
		expect(formatter(list)).toBe('formatted table 2')

		expect(buildTableFromListMock).toHaveBeenCalledTimes(2)
		const table2LabelFieldDefinition = buildTableFromListMock.mock.calls[0][1][0] as ValueTableFieldDefinition<object>
		expect(table2LabelFieldDefinition.label).toBe('#')
		const valueFunction2 = table2LabelFieldDefinition.value
		expect(valueFunction2({})).toBe('1')
		expect(valueFunction2({})).toBe('2')
		expect(valueFunction2({})).toBe('3')
	})
})

describe('writeOutput', () => {
	it('writes to file when there is one', async () => {
		writeFileMock.mockResolvedValue()

		await writeOutput('data', 'fn')

		expect(writeFileMock).toHaveBeenCalledTimes(1)
		expect(writeFileMock).toHaveBeenCalledWith('fn', 'data')
	})

	it('writes to stdout when there is no file', async () => {
		const writeSpy = jest.spyOn(process.stdout, 'write').mockReturnValue(true)

		await writeOutput('data\n')

		expect(writeSpy).toHaveBeenCalledTimes(1)
		expect(writeSpy).toHaveBeenCalledWith('data\n')
	})

	it('adds newline to stdout when necessary', async () => {
		const writeSpy = jest.spyOn(process.stdout, 'write').mockReturnValue(true)

		await writeOutput('data')

		expect(writeSpy).toHaveBeenCalledTimes(2)
		expect(writeSpy).toHaveBeenCalledWith('data')
		expect(writeSpy).toHaveBeenCalledWith('\n')
	})
})
