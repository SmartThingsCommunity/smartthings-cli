import {
	calculateOutputFormat,
	itemTableFormatter,
	jsonFormatter,
	listTableFormatter,
	sort,
	writeOutput,
	yamlFormatter,
} from '../../../lib/command/output.js'
import { IOFormat, formatFromFilename, stdoutIsTTY, writeFile } from '../../../lib/io-util.js'
import { DefaultTableGenerator, TableFieldDefinition, TableGenerator } from '../../../lib/table-generator.js'

import { SimpleType } from '../../test-lib/simple-type.js'


jest.mock('../../../lib/io-util.js')


describe('sort', () => {
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

		expect(calculateOutputFormat(flags)).toBe(IOFormat.JSON)
	})

	it('uses yaml when specified', () => {
		const flags = { yaml: true }

		expect(calculateOutputFormat(flags)).toBe(IOFormat.YAML)
	})

	it('gets format using formatFromFilename with output file when not specified', () => {
		const flags = { output: 'fn.json' }
		const formatFromFilenameMock = jest.mocked(formatFromFilename).mockReturnValue(IOFormat.JSON)

		expect(calculateOutputFormat(flags)).toBe(IOFormat.JSON)

		expect(formatFromFilenameMock).toHaveBeenCalledTimes(1)
		expect(formatFromFilenameMock).toHaveBeenCalledWith('fn.json')
	})

	it('defaults to specified default format', () => {
		expect(calculateOutputFormat({}, IOFormat.YAML)).toBe(IOFormat.YAML)
	})

	it('falls back to common in console with no other default specified', () => {
		const ttySpy = jest.mocked(stdoutIsTTY).mockReturnValue(true)

		expect(calculateOutputFormat({})).toBe(IOFormat.COMMON)
		expect(ttySpy).toHaveBeenCalledTimes(1)
	})

	it('falls back to JSON with no other default specified and not outputting to the console', () => {
		const ttySpy = jest.mocked(stdoutIsTTY).mockReturnValue(false)

		expect(calculateOutputFormat({})).toBe(IOFormat.JSON)
		expect(ttySpy).toHaveBeenCalledTimes(1)
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
		const buildTableFromItem = jest.fn()
		const mockTableGenerator: TableGenerator = {
			newOutputTable: jest.fn(),
			buildTableFromItem,
			buildTableFromList: jest.fn(),
		}

		const fieldDefinitions: TableFieldDefinition<SimpleType>[] = ['str', 'num']
		const formatter = itemTableFormatter(mockTableGenerator, fieldDefinitions)

		const expected = 'expected result'
		buildTableFromItem.mockReturnValue(expected)

		const item: SimpleType = { str: 'string', num: 5 }

		const result = formatter(item)

		expect(result).toBe(expected)
		expect(buildTableFromItem).toHaveBeenCalledTimes(1)
		expect(buildTableFromItem).toHaveBeenCalledWith(item, fieldDefinitions)
	})
})

describe('listTableFormatter', () => {
	const fieldDefinitions: TableFieldDefinition<SimpleType>[] = ['str', 'num']
	const expected = 'expected result'

	const list: SimpleType[] = [{ str: 'string1', num: 4 }, { str: 'string2', num: 5 }, { str: 'string3', num: 6 }]

	it('returns function that calls tableGenerator.buildTableFromList', () => {
		const buildTableFromList = jest.fn()
		const mockTableGenerator: TableGenerator = {
			newOutputTable: jest.fn(),
			buildTableFromItem: jest.fn(),
			buildTableFromList,
		}

		const formatter = listTableFormatter(mockTableGenerator, fieldDefinitions)

		buildTableFromList.mockReturnValue(expected)

		const result = formatter(list)

		expect(result).toBe(expected)
		expect(buildTableFromList).toHaveBeenCalledTimes(1)
		expect(buildTableFromList).toHaveBeenCalledWith(list, fieldDefinitions)
	})

	it('handles includeIndex', () => {
		const tableGenerator = new DefaultTableGenerator(true)
		const formatter = listTableFormatter(tableGenerator, fieldDefinitions, /* includeIndex */ true)

		const buildTableSpy = jest.spyOn(tableGenerator, 'buildTableFromList')

		const result = formatter(list)

		expect(buildTableSpy).toHaveBeenCalledTimes(1)
		expect(result).toContain(' # ')
		expect(result).toContain(' 1 ')
		expect(result).toContain(' 2 ')
		expect(result).toContain(' 3 ')

		const result2 = formatter(list)

		// Ensure resets to 1 if we call twice.
		expect(buildTableSpy).toHaveBeenCalledTimes(2)
		expect(result2).toContain(' # ')
		expect(result2).toContain(' 1 ')
		expect(result2).toContain(' 2 ')
		expect(result2).toContain(' 3 ')
	})
})

describe('writeOutput', () => {
	it('writes to file when there is one', async () => {
		const writeFileMock = jest.mocked(writeFile).mockResolvedValue()

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
