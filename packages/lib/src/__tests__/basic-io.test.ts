import { CLIError } from '@oclif/errors'

import { inputAndOutputItem, inputItem, outputItem, outputList } from '../basic-io'
import * as format from '../format'
import { InputProcessor } from '../input'
import * as inputBuilder from '../input-builder'
import { IOFormat } from '../io-util'
import * as output from '../output'
import * as outputBuilder from '../output-builder'
import { buildMockCommand } from './test-lib/mock-command'
import { SimpleType } from './test-lib/simple-type'


describe('basic-io', () => {
	const item = { str: 'string', num: 5 }
	const list = [item]
	const baseCommand = {
		...buildMockCommand(),
		flags: {
			output: 'output.yaml',
		},
	}
	const formatAndWriteItemSpy = jest.spyOn(format, 'formatAndWriteItem').mockImplementation(async () => { /* empty */ })
	const formatAndWriteListSpy = jest.spyOn(format, 'formatAndWriteList').mockImplementation(async () => { /* empty */ })

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('inputItem', () => {
		const buildInputProcessorSpy = jest.spyOn(inputBuilder, 'buildInputProcessor')

		it('accepts input and returns input', async () => {
			const ioFormatMock = jest.fn()
			const hasInputMock = jest.fn()
			const readMock = jest.fn()
			class TestInputProcessor implements InputProcessor<SimpleType> {
				get ioFormat(): IOFormat.COMMON {
					return ioFormatMock()
				}
				hasInput = hasInputMock
				read = readMock
			}
			const inputProcessor = new TestInputProcessor()

			ioFormatMock.mockReturnValue(IOFormat.COMMON)
			hasInputMock.mockReturnValue(true)
			readMock.mockResolvedValue(item)

			buildInputProcessorSpy.mockReturnValue(inputProcessor)

			expect(await inputItem(baseCommand)).toEqual([item, IOFormat.COMMON])

			expect(ioFormatMock).toHaveBeenCalled()
			expect(hasInputMock).toHaveBeenCalledTimes(1)
			expect(readMock).toHaveBeenCalledTimes(1)
			expect(hasInputMock).toHaveBeenCalledBefore(readMock)
			expect(readMock).toHaveBeenCalledBefore(ioFormatMock)
		})

		it('throws exception when there is no input', async () => {
			const inputProcessor = {
				ioFormat: IOFormat.COMMON,
				hasInput: () => false,
				read: async () => item,
			}

			buildInputProcessorSpy.mockReturnValue(inputProcessor)

			await expect(inputItem(baseCommand)).rejects.toThrow(
				new CLIError('input is required either via file specified with --input option or from stdin'))
		})
	})

	describe('outputItem', () => {
		it('gets data and calls formatAndWriteItem', async () => {
			const command = {
				...baseCommand,
				tableFieldDefinitions: [],
			}

			const getDataMock = jest.fn().mockResolvedValue(item)

			const result = await outputItem<SimpleType>(command, getDataMock)

			expect(result).toBe(item)
			expect(formatAndWriteItemSpy).toHaveBeenCalledTimes(1)
			expect(formatAndWriteItemSpy).toHaveBeenLastCalledWith(command, item)
		})
	})

	describe('outputList', () => {
		it('gets data and calls formatAndWriteList', async () => {
			const command = {
				...baseCommand,
				listTableFieldDefinitions: [],
				primaryKeyName: 'num',
				sortKeyName: 'str',
			}

			const getDataMock = jest.fn().mockResolvedValue(list)

			const result = await outputList<SimpleType>(command, getDataMock)

			expect(result).toBe(list)
			expect(formatAndWriteListSpy).toHaveBeenCalledTimes(1)
			expect(formatAndWriteListSpy).toHaveBeenLastCalledWith(command, list, false)
		})

		it('passes includeIndex value on to formatAndWriteList', async () => {
			const command = {
				...baseCommand,
				listTableFieldDefinitions: [],
				primaryKeyName: 'num',
				sortKeyName: 'str',
			}

			const getDataMock = jest.fn().mockResolvedValue(list)

			const result = await outputList<SimpleType>(command, getDataMock, true)

			expect(result).toBe(list)
			expect(formatAndWriteListSpy).toHaveBeenCalledTimes(1)
			expect(formatAndWriteListSpy).toHaveBeenLastCalledWith(command, list, true)
		})
	})

	describe('inputAndOutputItem', () => {
		const buildInputProcessorSpy = jest.spyOn(inputBuilder, 'buildInputProcessor')

		it('accepts input, executes command and writes output', async () => {
			const command = {
				...baseCommand,
				tableFieldDefinitions: [],
			}

			const ioFormatMock = jest.fn()
			const hasInputMock = jest.fn()
			const readMock = jest.fn()
			class TestInputProcessor implements InputProcessor<SimpleType> {
				get ioFormat(): IOFormat.COMMON {
					return ioFormatMock()
				}
				hasInput = hasInputMock
				read = readMock
			}
			const inputProcessor = new TestInputProcessor()

			ioFormatMock.mockReturnValue(IOFormat.COMMON)
			hasInputMock.mockReturnValue(true)
			readMock.mockResolvedValue(item)

			const executeCommandMock = jest.fn().mockResolvedValue(item)
			buildInputProcessorSpy.mockReturnValue(inputProcessor)

			await inputAndOutputItem(command, executeCommandMock)

			expect(executeCommandMock).toHaveBeenCalledTimes(1)
			expect(executeCommandMock).toHaveBeenCalledWith(undefined, item)
			expect(formatAndWriteItemSpy).toHaveBeenCalledTimes(1)
			expect(formatAndWriteItemSpy).toHaveBeenLastCalledWith(command, item, inputProcessor.ioFormat)

			expect(ioFormatMock).toHaveBeenCalled()
			expect(hasInputMock).toHaveBeenCalledTimes(1)
			expect(readMock).toHaveBeenCalledTimes(1)
			expect(hasInputMock).toHaveBeenCalledBefore(readMock)
			expect(readMock).toHaveBeenCalledBefore(ioFormatMock)
		})

		it('accepts and writes input in dry run mode', async () => {
			const command = {
				...baseCommand,
				tableFieldDefinitions: [],
				flags: {
					...baseCommand.flags,
					'dry-run': true,
				},
			}

			const inputProcessor = {
				ioFormat: IOFormat.YAML,
				hasInput: () => true,
				read: async () => item,
			}

			const outputFormatter = jest.fn()
			outputFormatter.mockReturnValue('output')

			const buildOutputFormatterSpy = jest.spyOn(outputBuilder, 'buildOutputFormatter').mockReturnValue(outputFormatter)
			const writeOutputSpy = jest.spyOn(output, 'writeOutput').mockResolvedValue()

			const executeCommandMock = jest.fn()
			buildInputProcessorSpy.mockReturnValue(inputProcessor)

			await inputAndOutputItem(command, executeCommandMock)

			expect(executeCommandMock).toHaveBeenCalledTimes(0)

			expect(buildOutputFormatterSpy).toHaveBeenCalledTimes(1)
			expect(buildOutputFormatterSpy).toHaveBeenCalledWith(command, inputProcessor.ioFormat)
			expect(writeOutputSpy).toHaveBeenCalledTimes(1)
			expect(writeOutputSpy).toHaveBeenCalledWith('output', 'output.yaml')
		})

		it('throws exception when input could not be found', async () => {
			const command = {
				...baseCommand,
				tableFieldDefinitions: [],
			}

			const inputProcessor = {
				ioFormat: IOFormat.COMMON,
				hasInput: () => false,
				read: async () => item,
			}

			const executeCommandMock = jest.fn().mockResolvedValue(item)
			buildInputProcessorSpy.mockReturnValue(inputProcessor)

			await expect(inputAndOutputItem(command, executeCommandMock)).rejects.toThrow(
				new CLIError('input is required either via file specified with --input option or from stdin'))

			expect(executeCommandMock).toHaveBeenCalledTimes(0)
			expect(formatAndWriteItemSpy).toHaveBeenCalledTimes(0)
		})
	})
})
