import { CLIError } from '@oclif/errors'

import { inputAndOutputItem, outputItem, outputList } from '../basic-io'
import * as format from '../format'
import { InputProcessor, UserInputProcessor } from '../input'
import * as inputBuilder from '../input-builder'
import { IOFormat } from '../io-util'
import * as output from '../output'
import * as outputBuilder from '../output-builder'
import { SmartThingsCommandInterface } from '../smartthings-command'
import { buildMockCommand } from './test-lib/mock-command'
import { SimpleType } from './test-lib/simple-type'


describe('basic-io', () => {
	const item = { 'str': 'string', num: 5 }
	const list = [item]
	const baseCommand = {
		...buildMockCommand(),
		flags: {
			output: 'output.yaml',
		},
	}
	const formatAndWriteItemSpy = jest.spyOn(format, 'formatAndWriteItem')
	const formatAndWriteListSpy = jest.spyOn(format, 'formatAndWriteList')

	beforeEach(() => {
		formatAndWriteItemSpy.mockImplementation(async () => { /* empty */ })
		formatAndWriteListSpy.mockImplementation(async () => { /* empty */ })
	})

	afterEach(() => {
		jest.clearAllMocks()
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
		let buildInputProcessorSpy: jest.SpyInstance<InputProcessor<unknown>, [command: SmartThingsCommandInterface, ...alternateInputProcessors: UserInputProcessor<unknown>[]]>

		beforeEach(() => {
			buildInputProcessorSpy = jest.spyOn(inputBuilder, 'buildInputProcessor')
		})

		it ('accepts input, executes command and writes output', async () => {
			const command = {
				...baseCommand,
				tableFieldDefinitions: [],
			}

			const inputProcessor = {
				ioFormat: IOFormat.COMMON,
				hasInput: () => true,
				read: async () => item,
			}

			const executeCommandMock = jest.fn().mockResolvedValue(item)
			buildInputProcessorSpy.mockReturnValue(inputProcessor)

			await inputAndOutputItem(command, executeCommandMock)

			expect(executeCommandMock).toHaveBeenCalledTimes(1)
			expect(executeCommandMock).toHaveBeenCalledWith(item)
			expect(formatAndWriteItemSpy).toHaveBeenCalledTimes(1)
			expect(formatAndWriteItemSpy).toHaveBeenLastCalledWith(command, item, inputProcessor.ioFormat)
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
