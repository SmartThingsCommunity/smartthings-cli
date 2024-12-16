import { jest } from '@jest/globals'

import type { GetDataFunction } from '../../../lib/command/io-defs.js'
import type { OutputListConfig, OutputListFlags } from '../../../lib/command/output-list.js'
import type { formatAndWriteList } from '../../../lib/command/format.js'
import type {
	buildInputProcessor,
	inputProcessorBuilder,
} from '../../../lib/command/input-builder.js'
import type { sort } from '../../../lib/command/output.js'
import type { buildOutputFormatterBuilder } from '../../../lib/command/output-builder.js'
import type {
	SmartThingsCommand,
	SmartThingsCommandFlags,
} from '../../../lib/command/smartthings-command.js'
import type { SimpleType } from '../../test-lib/simple-type.js'


const formatAndWriteListMock = jest.fn<typeof formatAndWriteList>()
jest.unstable_mockModule('../../../lib/command/format.js', () => ({
	formatAndWriteList: formatAndWriteListMock,
}))

const inputProcessorBuilderMock = jest.fn<typeof inputProcessorBuilder>()
const buildInputProcessorMock = jest.fn<typeof buildInputProcessor>()
jest.unstable_mockModule('../../../lib/command/input-builder.js', () => ({
	inputProcessorBuilder: inputProcessorBuilderMock,
	buildInputProcessor: buildInputProcessorMock,
}))

const sortMock = jest.fn<typeof sort>()
jest.unstable_mockModule('../../../lib/command/output.js', () => ({
	sort: sortMock,
}))

const buildOutputFormatterBuilderMock =
	jest.fn<typeof buildOutputFormatterBuilder<SmartThingsCommandFlags>>()
jest.unstable_mockModule('../../../lib/command/output-builder.js', () => ({
	buildOutputFormatterBuilder: buildOutputFormatterBuilderMock,
}))


const { outputList } = await import('../../../lib/command/output-list.js')


describe('outputList', () => {
	const item1: SimpleType = { str: 'string-1', num: 5 }
	const item2: SimpleType = { str: 'string-2', num: 6 }
	const list = [item1, item2]

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

		expect(sortMock).toHaveBeenCalledExactlyOnceWith(list, 'str')
		expect(formatAndWriteListMock)
			.toHaveBeenCalledExactlyOnceWith(command, config, sorted, false, false)
	})

	it('passes includeIndex value on to formatAndWriteList', async () => {
		expect(await outputList<SimpleType>(command, config, getDataMock, true)).toBe(sorted)

		expect(sortMock).toHaveBeenCalledExactlyOnceWith(list, 'str')
		expect(formatAndWriteListMock)
			.toHaveBeenCalledExactlyOnceWith(command, config, sorted, true, false)
	})

	it('passes forUserQuery value on to formatAndWriteList', async () => {
		expect(await outputList<SimpleType>(command, config, getDataMock, false, true)).toBe(sorted)

		expect(sortMock).toHaveBeenCalledExactlyOnceWith(list, 'str')
		expect(formatAndWriteListMock)
			.toHaveBeenCalledExactlyOnceWith(command, config, sorted, false, true)
	})

	it('skips sorting when no sort key is specified', async () => {
		const config: OutputListConfig<SimpleType> = {
			listTableFieldDefinitions: [],
			primaryKeyName: 'num',
		}
		expect(await outputList<SimpleType>(command, config, getDataMock, false, true)).toBe(list)

		expect(sortMock).not.toHaveBeenCalled()
		expect(formatAndWriteListMock)
			.toHaveBeenCalledExactlyOnceWith(command, config, list, false, true)
	})
})
