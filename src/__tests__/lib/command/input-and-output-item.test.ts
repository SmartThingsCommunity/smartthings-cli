import { jest } from '@jest/globals'

import type { formatAndWriteItem, formatAndWriteList } from '../../../lib/command/format.js'
import type { InputAndOutputItemFlags } from '../../../lib/command/input-and-output-item.js'
import type { inputItem, inputItemBuilder } from '../../../lib/command/input-item.js'
import type { ActionFunction } from '../../../lib/command/io-defs.js'
import type { OutputFormatter, writeOutput } from '../../../lib/command/output.js'
import type { buildOutputFormatter, buildOutputFormatterBuilder } from '../../../lib/command/output-builder.js'
import type { SmartThingsCommand, SmartThingsCommandFlags } from '../../../lib/command/smartthings-command.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'
import type { SimpleType } from '../../test-lib/simple-type.js'


const formatAndWriteItemMock = jest.fn<typeof formatAndWriteItem>()
const formatAndWriteListMock = jest.fn<typeof formatAndWriteList>()
jest.unstable_mockModule('../../../lib/command/format.js', () => ({
	formatAndWriteItem: formatAndWriteItemMock,
	formatAndWriteList: formatAndWriteListMock,
}))

const inputItemMock = jest.fn<typeof inputItem>()
const inputItemBuilderMock = jest.fn<typeof inputItemBuilder>()
jest.unstable_mockModule('../../../lib/command/input-item.js', () => ({
	inputItem: inputItemMock,
	inputItemBuilder: inputItemBuilderMock,
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
	inputItemBuilderMock.mockReturnValueOnce(argvMock)

	expect(inputAndOutputItemBuilder(buildOutputFormatterBuilderArgvInput)).toBe(argvMock)

	expect(buildOutputFormatterBuilderMock)
		.toHaveBeenCalledExactlyOnceWith(buildOutputFormatterBuilderArgvInput)
	expect(inputItemBuilderMock)
		.toHaveBeenCalledExactlyOnceWith(buildOutputFormatterBuilderArgvMock)
	expect(optionMock).toHaveBeenCalledTimes(1)
})

describe('inputAndOutputItem', () => {
	const item: SimpleType = { str: 'string-1', num: 5 }
	const executeCommandMock = jest.fn<ActionFunction<void, SimpleType>>().mockResolvedValue(item)

	it('accepts input, executes command and writes output', async () => {
		const flags = { output: 'output.yaml' }
		const command = { flags } as SmartThingsCommand<InputAndOutputItemFlags>
		const config = {
			tableFieldDefinitions: [],
		}
		inputItemMock.mockResolvedValueOnce([item, 'common'])

		await inputAndOutputItem(command, config, executeCommandMock)

		expect(inputItemMock).toHaveBeenCalledExactlyOnceWith(flags)
		expect(executeCommandMock).toHaveBeenCalledExactlyOnceWith(undefined, item)
		expect(formatAndWriteItemMock)
			.toHaveBeenCalledExactlyOnceWith(command, config, item, 'common')

		expect(buildOutputFormatterMock).not.toHaveBeenCalled()
		expect(writeOutputMock).not.toHaveBeenCalled()
	})

	it('accepts and writes input in dry run mode', async () => {
		const formatterMock = jest.fn<OutputFormatter<SimpleType>>().mockReturnValueOnce('formatted output')
		buildOutputFormatterMock.mockReturnValueOnce(formatterMock)

		const flags = { dryRun: true, output: 'output flag' }
		const cliConfig = { profile: {} }
		const command = { flags, cliConfig } as SmartThingsCommand<InputAndOutputItemFlags>
		const config = {
			tableFieldDefinitions: [],
		}
		inputItemMock.mockResolvedValueOnce([item, 'yaml'])

		await inputAndOutputItem(command, config, executeCommandMock)

		expect(inputItemMock).toHaveBeenCalledExactlyOnceWith(flags)

		expect(buildOutputFormatterMock).toHaveBeenCalledExactlyOnceWith(flags, cliConfig, 'yaml')
		expect(formatterMock).toHaveBeenCalledExactlyOnceWith(item)
		expect(writeOutputMock).toHaveBeenCalledExactlyOnceWith('formatted output', 'output flag')

		expect(executeCommandMock).not.toHaveBeenCalled()
		expect(formatAndWriteItemMock).not.toHaveBeenCalled()
	})
})
