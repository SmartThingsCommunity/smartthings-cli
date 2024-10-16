import { jest } from '@jest/globals'

import type { ActionFunction } from '../../../lib/command/io-defs.js'
import type { InputAndOutputItemFlags } from '../../../lib/command/input-and-output-item.js'
import type { InputProcessor } from '../../../lib/command/input-processor.js'
import type { formatAndWriteItem, formatAndWriteList } from '../../../lib/command/format.js'
import type { buildInputProcessor, inputProcessorBuilder } from '../../../lib/command/input-builder.js'
import type { OutputFormatter, writeOutput } from '../../../lib/command/output.js'
import type { buildOutputFormatter, buildOutputFormatterBuilder } from '../../../lib/command/output-builder.js'
import type { SmartThingsCommand, SmartThingsCommandFlags } from '../../../lib/command/smartthings-command.js'
import type { SimpleType } from '../../test-lib/simple-type.js'
import type { IOFormat } from '../../../lib/io-util.js'
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

const writeOutputMock = jest.fn<typeof writeOutput>()
jest.unstable_mockModule('../../../lib/command/output.js', () => ({
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
} = await import('../../../lib/command/input-and-output-item.js')


test('inputAndOutputItemBuilder', () => {
	const buildOutputFormatterBuilderArgvInput = buildArgvMockStub<SmartThingsCommandFlags>()
	const { yargsMock: buildOutputFormatterBuilderArgvMock, optionMock, argvMock } =
		buildArgvMock<SimpleType & SmartThingsCommandFlags, SimpleType & InputAndOutputItemFlags>()
	buildOutputFormatterBuilderMock.mockReturnValueOnce(buildOutputFormatterBuilderArgvMock)
	inputProcessorBuilderMock.mockReturnValueOnce(argvMock)

	expect(inputAndOutputItemBuilder(buildOutputFormatterBuilderArgvInput)).toBe(argvMock)

	expect(buildOutputFormatterBuilderMock)
		.toHaveBeenCalledExactlyOnceWith(buildOutputFormatterBuilderArgvInput)
	expect(inputProcessorBuilderMock)
		.toHaveBeenCalledExactlyOnceWith(buildOutputFormatterBuilderArgvMock)
	expect(optionMock).toHaveBeenCalledTimes(1)
})

describe('inputAndOutputItem', () => {
	const ioFormatMock = jest.fn<() => IOFormat>()
	const hasInputMock = jest.fn<InputProcessor<SimpleType>['hasInput']>()
	const readMock = jest.fn<InputProcessor<SimpleType>['read']>()

	const item: SimpleType = { str: 'string-1', num: 5 }

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
		readMock.mockResolvedValue(item)
		ioFormatMock.mockReturnValue('common')

		const executeCommandMock = jest.fn<ActionFunction<void, SimpleType>>().mockResolvedValue(item)

		const flags = { output: 'output.yaml' }
		const command = { flags } as SmartThingsCommand<InputAndOutputItemFlags>
		const config = {
			tableFieldDefinitions: [],
		}

		await inputAndOutputItem(command, config, executeCommandMock)

		expect(ioFormatMock).toHaveBeenCalled()
		expect(hasInputMock).toHaveBeenCalledBefore(readMock)
		expect(readMock).toHaveBeenCalledBefore(ioFormatMock)
		expect(executeCommandMock).toHaveBeenCalledExactlyOnceWith(undefined, item)
		expect(formatAndWriteItemMock)
			.toHaveBeenCalledExactlyOnceWith(command, config, item, inputProcessor.ioFormat)
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
		readMock.mockResolvedValue(item)
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

		expect(buildOutputFormatterMock).toHaveBeenCalledExactlyOnceWith(flags, cliConfig, 'yaml')
		expect(formatterMock).toHaveBeenCalledExactlyOnceWith(item)
		expect(writeOutputMock).toHaveBeenCalledExactlyOnceWith('formatted output', 'output flag')

		expect(executeCommandMock).not.toHaveBeenCalled()
	})

	it('throws exception when input could not be found', async () => {
		const inputProcessor: InputProcessor<SimpleType> = {
			ioFormat: 'common',
			hasInput: () => false,
			read: async () => item,
		}
		buildInputProcessorMock.mockReturnValue(inputProcessor)

		const flags = { dryRun: true, output: 'output flag' }
		const command = { flags } as SmartThingsCommand<InputAndOutputItemFlags>
		const config = {
			tableFieldDefinitions: [],
		}
		const executeCommandMock = jest.fn<ActionFunction<void, SimpleType>>().mockResolvedValue(item)

		await expect(inputAndOutputItem(command, config, executeCommandMock)).rejects.toThrow(
			'input is required either via file specified with --input option or from stdin')

		expect(executeCommandMock).not.toHaveBeenCalled()
		expect(formatAndWriteItemMock).not.toHaveBeenCalled()
	})
})
