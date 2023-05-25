import { Errors } from '@oclif/core'

import { inputAndOutputItem, inputItem, outputItem, outputList, OutputListConfig } from '../basic-io.js'
import * as format from '../format.js'
import { InputProcessor } from '../input.js'
import * as inputBuilder from '../input-builder.js'
import { IOFormat } from '../io-util.js'
import * as output from '../output.js'
import * as outputBuilder from '../output-builder.js'
import { buildMockCommand } from './test-lib/mock-command.js'
import { SimpleType } from './test-lib/simple-type.js'


describe('basic-io', () => {
	const item = { str: 'string', num: 5 }
	const list = [item]
	const command = {
		...buildMockCommand(),
		flags: {
			output: 'output.yaml',
		},
	}
	const formatAndWriteItemSpy = jest.spyOn(format, 'formatAndWriteItem').mockImplementation(async () => { /* empty */ })
	const formatAndWriteListSpy = jest.spyOn(format, 'formatAndWriteList').mockImplementation(async () => { /* empty */ })

	describe('inputItem', () => {
		const buildInputProcessorSpy = jest.spyOn(inputBuilder, 'buildInputProcessor')

		const ioFormatMock = jest.fn()
		const hasInputMock = jest.fn()
		const readMock = jest.fn()
		it('accepts input and returns input', async () => {
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

			expect(await inputItem(command)).toEqual([item, IOFormat.COMMON])

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

			await expect(inputItem(command)).rejects.toThrow(
				new Errors.CLIError('input is required either via file specified with --input option or from stdin'))
		})

		it('works with async hasInput', async () => {
			const inputProcessor: InputProcessor<SimpleType> = {
				ioFormat: IOFormat.COMMON,
				hasInput: hasInputMock,
				read: readMock,
			}

			hasInputMock.mockResolvedValueOnce(true)
			readMock.mockResolvedValue(item)

			buildInputProcessorSpy.mockReturnValue(inputProcessor)

			expect(await inputItem(command)).toEqual([item, IOFormat.COMMON])

			expect(hasInputMock).toHaveBeenCalledTimes(1)
			expect(readMock).toHaveBeenCalledTimes(1)
			expect(hasInputMock).toHaveBeenCalledBefore(readMock)
			expect(readMock).toHaveBeenCalledBefore(ioFormatMock)
		})
	})

	describe('outputItem', () => {
		it('gets data and calls formatAndWriteItem', async () => {
			const config = {
				tableFieldDefinitions: [],
			}

			const getDataMock = jest.fn().mockResolvedValue(item)

			const result = await outputItem<SimpleType>(command, config, getDataMock)

			expect(result).toBe(item)
			expect(formatAndWriteItemSpy).toHaveBeenCalledTimes(1)
			expect(formatAndWriteItemSpy).toHaveBeenLastCalledWith(command, config, item)
		})
	})

	describe('outputList', () => {
		const config: OutputListConfig<SimpleType> = {
			listTableFieldDefinitions: [],
			primaryKeyName: 'num',
			sortKeyName: 'str',
		}

		it('gets data and calls formatAndWriteList', async () => {
			const getDataMock = jest.fn().mockResolvedValue(list)

			const result = await outputList<SimpleType>(command, config, getDataMock)

			expect(result).toBe(list)
			expect(formatAndWriteListSpy).toHaveBeenCalledTimes(1)
			expect(formatAndWriteListSpy).toHaveBeenLastCalledWith(command, config, list, false, false)
		})

		it('passes includeIndex value on to formatAndWriteList', async () => {
			const getDataMock = jest.fn().mockResolvedValue(list)

			const result = await outputList<SimpleType>(command, config, getDataMock, true)

			expect(result).toBe(list)
			expect(formatAndWriteListSpy).toHaveBeenCalledTimes(1)
			expect(formatAndWriteListSpy).toHaveBeenLastCalledWith(command, config, list, true, false)
		})

		it('passes forUserQuery value on to formatAndWriteList', async () => {
			const getDataMock = jest.fn().mockResolvedValue(list)

			const result = await outputList<SimpleType>(command, config, getDataMock, false, true)

			expect(result).toBe(list)
			expect(formatAndWriteListSpy).toHaveBeenCalledTimes(1)
			expect(formatAndWriteListSpy).toHaveBeenLastCalledWith(command, config, list, false, true)
		})
	})

	describe('inputAndOutputItem', () => {
		const buildInputProcessorSpy = jest.spyOn(inputBuilder, 'buildInputProcessor')

		it('accepts input, executes command and writes output', async () => {
			const config = {
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

			await inputAndOutputItem(command, config, executeCommandMock)

			expect(executeCommandMock).toHaveBeenCalledTimes(1)
			expect(executeCommandMock).toHaveBeenCalledWith(undefined, item)
			expect(formatAndWriteItemSpy).toHaveBeenCalledTimes(1)
			expect(formatAndWriteItemSpy).toHaveBeenLastCalledWith(command, config, item, inputProcessor.ioFormat)

			expect(ioFormatMock).toHaveBeenCalled()
			expect(hasInputMock).toHaveBeenCalledTimes(1)
			expect(readMock).toHaveBeenCalledTimes(1)
			expect(hasInputMock).toHaveBeenCalledBefore(readMock)
			expect(readMock).toHaveBeenCalledBefore(ioFormatMock)
		})

		it('accepts and writes input in dry run mode', async () => {
			const dryRunCommand = {
				...command,
				flags: {
					...command.flags,
					// eslint-disable-next-line @typescript-eslint/naming-convention
					'dry-run': true,
				},
			}
			const config = {
				tableFieldDefinitions: [],
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

			await inputAndOutputItem(dryRunCommand, config, executeCommandMock)

			expect(executeCommandMock).toHaveBeenCalledTimes(0)

			expect(buildOutputFormatterSpy).toHaveBeenCalledTimes(1)
			expect(buildOutputFormatterSpy).toHaveBeenCalledWith(dryRunCommand, inputProcessor.ioFormat)
			expect(writeOutputSpy).toHaveBeenCalledTimes(1)
			expect(writeOutputSpy).toHaveBeenCalledWith('output', 'output.yaml')
		})

		it('throws exception when input could not be found', async () => {
			const config = {
				tableFieldDefinitions: [],
			}

			const inputProcessor = {
				ioFormat: IOFormat.COMMON,
				hasInput: () => false,
				read: async () => item,
			}

			const executeCommandMock = jest.fn().mockResolvedValue(item)
			buildInputProcessorSpy.mockReturnValue(inputProcessor)

			await expect(inputAndOutputItem(command, config, executeCommandMock)).rejects.toThrow(
				new Errors.CLIError('input is required either via file specified with --input option or from stdin'))

			expect(executeCommandMock).toHaveBeenCalledTimes(0)
			expect(formatAndWriteItemSpy).toHaveBeenCalledTimes(0)
		})
	})
})
