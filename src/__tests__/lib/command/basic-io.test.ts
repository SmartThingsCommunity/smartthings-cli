import { jest } from '@jest/globals'

import {
	ActionFunction,
	GetDataFunction,
	InputAndOutputItemFlags,
	OutputItemFlags,
	OutputListConfig,
	OutputListFlags,
} from '../../../lib/command/basic-io.js'
import { InputProcessor } from '../../../lib/command/input-processor.js'
import { formatAndWriteItem, formatAndWriteList } from '../../../lib/command/format.js'
import { InputProcessorFlags, buildInputProcessor, inputProcessorBuilder } from '../../../lib/command/input-builder.js'
import { OutputFormatter, sort, writeOutput } from '../../../lib/command/output.js'
import { buildOutputFormatter, buildOutputFormatterBuilder } from '../../../lib/command/output-builder.js'
import { SmartThingsCommand, SmartThingsCommandFlags } from '../../../lib/command/smartthings-command.js'
import { SimpleType } from '../../test-lib/simple-type.js'
import { IOFormat } from '../../../lib/io-util.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'


const formatAndWriteItemMock = jest.fn<typeof formatAndWriteItem>()
const formatAndWriteListMock = jest.fn<typeof formatAndWriteList>()
jest.unstable_mockModule('../../../lib/command/format.js', () => ({
	formatAndWriteItem: formatAndWriteItemMock,
	formatAndWriteList: formatAndWriteListMock,
}))

const inputProcessorBuilderMock = jest.fn<typeof inputProcessorBuilder>()
const buildInputProcessorMock = jest.fn<typeof buildInputProcessor>()
jest.unstable_mockModule('../../../lib/command/input-builder.js', () => ({
	inputProcessorBuilder: inputProcessorBuilderMock,
	buildInputProcessor: buildInputProcessorMock,
}))

const sortMock = jest.fn<typeof sort>()
const writeOutputMock = jest.fn<typeof writeOutput>()
jest.unstable_mockModule('../../../lib/command/output.js', () => ({
	sort: sortMock,
	writeOutput: writeOutputMock,
}))

const buildOutputFormatterBuilderMock = jest.fn<typeof buildOutputFormatterBuilder<SmartThingsCommandFlags>>()
const buildOutputFormatterMock = jest.fn<typeof buildOutputFormatter<SimpleType>>()
jest.unstable_mockModule('../../../lib/command/output-builder.js', () => ({
	buildOutputFormatterBuilder: buildOutputFormatterBuilderMock,
	buildOutputFormatter: buildOutputFormatterMock,
}))


const {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	inputItem,
	outputItem,
	outputList,
} = await import('../../../lib/command/basic-io.js')


const item1: SimpleType = { str: 'string-1', num: 5 }
const item2: SimpleType = { str: 'string-2', num: 6 }
const list = [item1, item2]

const ioFormatMock = jest.fn<() => IOFormat>()
const hasInputMock = jest.fn<InputProcessor<SimpleType>['hasInput']>()
const readMock = jest.fn<InputProcessor<SimpleType>['read']>()

describe('inputItem', () => {
	const flags: InputProcessorFlags = {
		input: 'input.yaml',
	}

	const inputProcessor: InputProcessor<SimpleType> = {
		get ioFormat(): IOFormat {
			return ioFormatMock()
		},
		hasInput: hasInputMock,
		read: readMock,
	}

	it('accepts input and returns input', async () => {
		ioFormatMock.mockReturnValueOnce('common')
		hasInputMock.mockReturnValueOnce(true)
		readMock.mockResolvedValueOnce(item1)

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
		const inputProcessor: InputProcessor<SimpleType> = {
			ioFormat: 'common',
			hasInput: () => false,
			read: async () => item1,
		}

		buildInputProcessorMock.mockReturnValueOnce(inputProcessor)

		await expect(inputItem(flags)).rejects
			.toThrow('input is required either via file specified with --input option or from stdin')
	})

	it('works with async hasInput', async () => {
		ioFormatMock.mockReturnValueOnce('common')
		hasInputMock.mockReturnValueOnce(Promise.resolve(true))
		readMock.mockResolvedValueOnce(item1)

		buildInputProcessorMock.mockReturnValueOnce(inputProcessor)

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

	const getDataMock = jest.fn<GetDataFunction<SimpleType>>().mockResolvedValue(item1)

	expect(await outputItem<SimpleType>(command, config, getDataMock)).toBe(item1)

	expect(getDataMock).toHaveBeenCalledTimes(1)
	expect(getDataMock).toHaveBeenCalledWith()
	expect(formatAndWriteItemMock).toHaveBeenCalledTimes(1)
	expect(formatAndWriteItemMock).toHaveBeenLastCalledWith(command, config, item1)
})

describe('outputList', () => {
	const getDataMock = jest.fn<GetDataFunction<SimpleType[]>>().mockResolvedValue(list)
	const sorted = [item2, item1]
	sortMock.mockReturnValue(sorted)
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

test('inputAndOutputItemBuilder', () => {
	const buildOutputFormatterBuilderArgvInput = buildArgvMockStub<SmartThingsCommandFlags>()
	const { yargsMock: buildOutputFormatterBuilderArgvMock, optionMock, argvMock } =
		buildArgvMock<SimpleType & SmartThingsCommandFlags, SimpleType & InputAndOutputItemFlags>()
	buildOutputFormatterBuilderMock.mockReturnValueOnce(buildOutputFormatterBuilderArgvMock)
	inputProcessorBuilderMock.mockReturnValueOnce(argvMock)

	expect(inputAndOutputItemBuilder(buildOutputFormatterBuilderArgvInput)).toBe(argvMock)

	expect(buildOutputFormatterBuilderMock).toHaveBeenCalledTimes(1)
	expect(buildOutputFormatterBuilderMock).toHaveBeenCalledWith(buildOutputFormatterBuilderArgvInput)
	expect(inputProcessorBuilderMock).toHaveBeenCalledTimes(1)
	expect(inputProcessorBuilderMock).toHaveBeenCalledWith(buildOutputFormatterBuilderArgvMock)
	expect(optionMock).toHaveBeenCalledTimes(1)
})

describe('inputAndOutputItem', () => {
	it('accepts input, executes command and writes output', async () => {
		const inputProcessor: InputProcessor<SimpleType> = {
			get ioFormat(): IOFormat {
				return ioFormatMock()
			},
			hasInput: hasInputMock,
			read: readMock,
		}
		buildInputProcessorMock.mockReturnValue(inputProcessor)

		hasInputMock.mockReturnValue(true)
		readMock.mockResolvedValue(item1)
		ioFormatMock.mockReturnValue('common')

		const executeCommandMock = jest.fn<ActionFunction<void, SimpleType>>().mockResolvedValue(item1)

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
			get ioFormat(): IOFormat {
				return ioFormatMock()
			},
			hasInput: hasInputMock,
			read: readMock,
		}
		buildInputProcessorMock.mockReturnValue(inputProcessor)

		hasInputMock.mockReturnValue(true)
		readMock.mockResolvedValue(item1)
		ioFormatMock.mockReturnValue('yaml')

		const formatterMock = jest.fn<OutputFormatter<SimpleType>>().mockReturnValueOnce('formatted output')
		buildOutputFormatterMock.mockReturnValueOnce(formatterMock)

		const flags = { dryRun: true, output: 'output flag' }
		const cliConfig = { profile: {} }
		const command = { flags, cliConfig } as SmartThingsCommand<InputAndOutputItemFlags>
		const config = {
			tableFieldDefinitions: [],
		}
		const executeCommandMock = jest.fn<ActionFunction<void, SimpleType>>()

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
		const inputProcessor: InputProcessor<SimpleType> = {
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
		const executeCommandMock = jest.fn<ActionFunction<void, SimpleType>>().mockResolvedValue(item1)

		await expect(inputAndOutputItem(command, config, executeCommandMock)).rejects.toThrow(
			'input is required either via file specified with --input option or from stdin')

		expect(executeCommandMock).toHaveBeenCalledTimes(0)
		expect(formatAndWriteItemMock).toHaveBeenCalledTimes(0)
	})
})
