import { IOFormat } from '../../../lib/io-util.js'
import {
	inputAndOutputItem,
	InputAndOutputItemFlags,
	inputItem,
	outputItem,
	OutputItemFlags,
	outputList,
	OutputListConfig,
	OutputListFlags,
} from '../../../lib/command/basic-io.js'
import { InputProcessor } from '../../../lib/command/input.js'
import { formatAndWriteItem, formatAndWriteList } from '../../../lib/command/format.js'
import { buildInputProcessor, InputBuilderFlags } from '../../../lib/command/input-builder.js'
import { OutputFormatter, sort, writeOutput } from '../../../lib/command/output.js'
import { buildOutputFormatter, BuildOutputFormatterFlags } from '../../../lib/command/output-builder.js'
import { SmartThingsCommand } from '../../../lib/command/smartthings-command.js'
import { SimpleType } from '../../test-lib/simple-type.js'


jest.mock('../../../lib/command/format.js')
jest.mock('../../../lib/command/input-builder.js')
jest.mock('../../../lib/command/output.js')
jest.mock('../../../lib/command/output-builder.js')


const item1 = { str: 'string-1', num: 5 }
const item2 = { str: 'string-2', num: 6 }
const list = [item1, item2]

const formatAndWriteItemMock = jest.mocked(formatAndWriteItem)
const formatAndWriteListMock = jest.mocked(formatAndWriteList)

const buildInputProcessorMock = jest.mocked(buildInputProcessor)

const ioFormatMock = jest.fn()
const hasInputMock = jest.fn()
const readMock = jest.fn()

describe('inputItem', () => {
	const flags: InputBuilderFlags = {
		input: 'input.yaml',
	}

	const inputProcessor: InputProcessor<SimpleType> = {
		get ioFormat(): 'common' {
			return ioFormatMock()
		},
		hasInput: hasInputMock,
		read: readMock,
	}

	it('accepts input and returns input', async () => {
		ioFormatMock.mockReturnValue('common')
		hasInputMock.mockReturnValue(true)
		readMock.mockResolvedValue(item1)

		buildInputProcessorMock.mockReturnValue(inputProcessor)

		expect(await inputItem(flags)).toEqual([item1, 'common'])

		expect(buildInputProcessorMock).toHaveBeenCalledTimes(1)
		expect(buildInputProcessorMock).toHaveBeenCalledWith(flags)
		expect(hasInputMock).toHaveBeenCalledTimes(1)
		expect(readMock).toHaveBeenCalledTimes(1)
		expect(ioFormatMock).toHaveBeenCalled()
		expect(hasInputMock).toHaveBeenCalledBefore(readMock)
		expect(readMock).toHaveBeenCalledBefore(ioFormatMock)
	})

	it('throws exception when there is no input', async () => {
		const inputProcessor = {
			ioFormat: 'common',
			hasInput: () => false,
			read: async () => item1,
		}

		buildInputProcessorMock.mockReturnValue(inputProcessor)

		await expect(inputItem(flags)).rejects
			.toThrow('input is required either via file specified with --input option or from stdin')
	})

	it('works with async hasInput', async () => {
		hasInputMock.mockResolvedValueOnce(true)
		readMock.mockResolvedValue(item1)

		buildInputProcessorMock.mockReturnValue(inputProcessor)

		expect(await inputItem(flags)).toEqual([item1, 'common'])

		expect(buildInputProcessorMock).toHaveBeenCalledTimes(1)
		expect(buildInputProcessorMock).toHaveBeenCalledWith(flags)
		expect(hasInputMock).toHaveBeenCalledTimes(1)
		expect(readMock).toHaveBeenCalledTimes(1)
		expect(ioFormatMock).toHaveBeenCalled()
		expect(hasInputMock).toHaveBeenCalledBefore(readMock)
		expect(readMock).toHaveBeenCalledBefore(ioFormatMock)
	})
})

test('outputItem', async () => {
	const command = { flags: { output: 'output.yaml' } } as SmartThingsCommand<OutputItemFlags>
	const config = {
		tableFieldDefinitions: [],
	}

	const getDataMock = jest.fn().mockResolvedValue(item1)

	expect(await outputItem<SimpleType>(command, config, getDataMock)).toBe(item1)

	expect(getDataMock).toHaveBeenCalledTimes(1)
	expect(getDataMock).toHaveBeenCalledWith()
	expect(formatAndWriteItemMock).toHaveBeenCalledTimes(1)
	expect(formatAndWriteItemMock).toHaveBeenLastCalledWith(command, config, item1)
})

describe('outputList', () => {
	const getDataMock = jest.fn().mockResolvedValue(list)
	const sorted = [item2, item1]
	const sortMock = jest.mocked(sort).mockReturnValue(sorted)
	const command = { flags: { output: 'output.yaml' } } as SmartThingsCommand<OutputListFlags>
	const config: OutputListConfig<SimpleType> = {
		listTableFieldDefinitions: [],
		primaryKeyName: 'num',
		sortKeyName: 'str',
	}

	it('gets data and calls formatAndWriteList', async () => {
		expect(await outputList<SimpleType>(command, config, getDataMock)).toBe(sorted)

		expect(sortMock).toHaveBeenCalledTimes(1)
		expect(sortMock).toHaveBeenCalledWith(list, 'str')
		expect(formatAndWriteListMock).toHaveBeenCalledTimes(1)
		expect(formatAndWriteListMock).toHaveBeenLastCalledWith(command, config, sorted, false, false)
	})

	it('passes includeIndex value on to formatAndWriteList', async () => {
		expect(await outputList<SimpleType>(command, config, getDataMock, true)).toBe(sorted)

		expect(sortMock).toHaveBeenCalledTimes(1)
		expect(sortMock).toHaveBeenCalledWith(list, 'str')
		expect(formatAndWriteListMock).toHaveBeenCalledTimes(1)
		expect(formatAndWriteListMock).toHaveBeenLastCalledWith(command, config, sorted, true, false)
	})

	it('passes forUserQuery value on to formatAndWriteList', async () => {
		expect(await outputList<SimpleType>(command, config, getDataMock, false, true)).toBe(sorted)

		expect(sortMock).toHaveBeenCalledTimes(1)
		expect(sortMock).toHaveBeenCalledWith(list, 'str')
		expect(formatAndWriteListMock).toHaveBeenCalledTimes(1)
		expect(formatAndWriteListMock).toHaveBeenLastCalledWith(command, config, sorted, false, true)
	})

	it('skips sorting when no sort key is specified', async () => {
		const config: OutputListConfig<SimpleType> = {
			listTableFieldDefinitions: [],
			primaryKeyName: 'num',
		}
		expect(await outputList<SimpleType>(command, config, getDataMock, false, true)).toBe(list)

		expect(sortMock).toHaveBeenCalledTimes(0)
		expect(formatAndWriteListMock).toHaveBeenCalledTimes(1)
		expect(formatAndWriteListMock).toHaveBeenLastCalledWith(command, config, list, false, true)
	})
})


describe('inputAndOutputItem', () => {
	it('accepts input, executes command and writes output', async () => {
		const inputProcessor: InputProcessor<SimpleType> = {
			get ioFormat(): 'common' {
				return ioFormatMock()
			},
			hasInput: hasInputMock,
			read: readMock,
		}
		buildInputProcessorMock.mockReturnValue(inputProcessor)

		hasInputMock.mockReturnValue(true)
		readMock.mockResolvedValue(item1)
		ioFormatMock.mockReturnValue('common')

		const executeCommandMock = jest.fn().mockResolvedValue(item1)

		const flags = { output: 'output.yaml' }
		const command = { flags } as SmartThingsCommand<InputAndOutputItemFlags>
		const config = {
			tableFieldDefinitions: [],
		}

		await inputAndOutputItem(command, config, executeCommandMock)

		expect(ioFormatMock).toHaveBeenCalled()
		expect(hasInputMock).toHaveBeenCalledBefore(readMock)
		expect(readMock).toHaveBeenCalledBefore(ioFormatMock)
		expect(executeCommandMock).toHaveBeenCalledTimes(1)
		expect(executeCommandMock).toHaveBeenCalledWith(undefined, item1)
		expect(formatAndWriteItemMock).toHaveBeenCalledTimes(1)
		expect(formatAndWriteItemMock).toHaveBeenLastCalledWith(command, config, item1, inputProcessor.ioFormat)
	})

	it('accepts and writes input in dry run mode', async () => {
		const inputProcessor: InputProcessor<SimpleType> = {
			get ioFormat(): 'yaml' {
				return ioFormatMock()
			},
			hasInput: hasInputMock,
			read: readMock,
		}
		buildInputProcessorMock.mockReturnValue(inputProcessor)

		hasInputMock.mockReturnValue(true)
		readMock.mockResolvedValue(item1)
		ioFormatMock.mockReturnValue('yaml')

		const formatterMock = jest.fn().mockReturnValueOnce('formatted output')
		const buildOutputFormatterMock = buildOutputFormatter as unknown as
		jest.Mock<OutputFormatter<SimpleType>, [
			SmartThingsCommand<BuildOutputFormatterFlags>,
			IOFormat | undefined,
			OutputFormatter<SimpleType> | undefined,
		]>
		buildOutputFormatterMock.mockReturnValueOnce(formatterMock)
		const writeOutputMock = jest.mocked(writeOutput)

		const flags = { dryRun: true, output: 'output flag' }
		const cliConfig = { profile: {} }
		const command = { flags, cliConfig } as SmartThingsCommand<InputAndOutputItemFlags>
		const config = {
			tableFieldDefinitions: [],
		}
		const executeCommandMock = jest.fn()

		await inputAndOutputItem(command, config, executeCommandMock)

		expect(ioFormatMock).toHaveBeenCalled()
		expect(hasInputMock).toHaveBeenCalledBefore(readMock)
		expect(readMock).toHaveBeenCalledBefore(ioFormatMock)

		expect(buildOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(buildOutputFormatterMock).toHaveBeenCalledWith(flags, cliConfig, 'yaml')
		expect(formatterMock).toHaveBeenCalledTimes(1)
		expect(formatterMock).toHaveBeenCalledWith(item1)
		expect(writeOutputMock).toHaveBeenCalledTimes(1)
		expect(writeOutputMock).toHaveBeenCalledWith('formatted output', 'output flag')

		expect(executeCommandMock).toHaveBeenCalledTimes(0)
	})

	it('throws exception when input could not be found', async () => {
		const inputProcessor = {
			ioFormat: 'common',
			hasInput: () => false,
			read: async () => item1,
		}
		buildInputProcessorMock.mockReturnValue(inputProcessor)

		const flags = { dryRun: true, output: 'output flag' }
		const command = { flags } as SmartThingsCommand<InputAndOutputItemFlags>
		const config = {
			tableFieldDefinitions: [],
		}
		const executeCommandMock = jest.fn().mockResolvedValue(item1)

		await expect(inputAndOutputItem(command, config, executeCommandMock)).rejects.toThrow(
			'input is required either via file specified with --input option or from stdin')

		expect(executeCommandMock).toHaveBeenCalledTimes(0)
		expect(formatAndWriteItemMock).toHaveBeenCalledTimes(0)
	})
})
