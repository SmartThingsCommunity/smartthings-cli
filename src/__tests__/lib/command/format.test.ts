import { jest } from '@jest/globals'

import { TableGenerator } from '../../../lib/table-generator.js'
import { Naming } from '../../../lib/command/basic-io.js'
import {
	CommonListOutputProducer,
	CustomCommonListOutputProducer,
	CustomCommonOutputProducer,
	FormatAndWriteItemConfig,
	FormatAndWriteListConfig,
	TableCommonListOutputProducer,
} from '../../../lib/command/format.js'
import { OutputFormatter, itemTableFormatter, listTableFormatter, writeOutput } from '../../../lib/command/output.js'
import { buildOutputFormatter, BuildOutputFormatterFlags } from '../../../lib/command/output-builder.js'
import { SmartThingsCommand } from '../../../lib/command/smartthings-command.js'
import { SimpleType } from '../../test-lib/simple-type.js'


const itemTableFormatterMock: jest.Mock<typeof itemTableFormatter<SimpleType>> = jest.fn()
const listTableFormatterMock: jest.Mock<typeof listTableFormatter<SimpleType>> = jest.fn()
const writeOutputMock: jest.Mock<typeof writeOutput> = jest.fn()
writeOutputMock.mockResolvedValue()
jest.unstable_mockModule('../../../lib/command/output.js', () => ({
	itemTableFormatter: itemTableFormatterMock,
	listTableFormatter: listTableFormatterMock,
	writeOutput: writeOutputMock,
}))

const buildOutputFormatterMock: jest.Mock<typeof buildOutputFormatter<SimpleType>> = jest.fn()
const outputFormatterMock: jest.Mock<OutputFormatter<SimpleType>> = jest.fn()
outputFormatterMock.mockReturnValue('output')
buildOutputFormatterMock.mockReturnValue(outputFormatterMock)
jest.unstable_mockModule('../../../lib/command/output-builder.js', () => ({
	buildOutputFormatterBuilder: jest.fn(),
	buildOutputFormatter: buildOutputFormatterMock,
}))


const { formatAndWriteItem, formatAndWriteList } = await import('../../../lib/command/format.js')


const item: SimpleType = { str: 'string', num: 5 }
const list = [item]
const tableGeneratorMock = {} as TableGenerator
const flags = {
	output: 'output.yaml',
}
const cliConfig = {}
const command = {
	flags,
	cliConfig,
	tableGenerator: tableGeneratorMock,
} as unknown as SmartThingsCommand<BuildOutputFormatterFlags>

describe('formatAndWriteItem', () => {
	const buildTableOutputMock: jest.Mock<CustomCommonOutputProducer<SimpleType>['buildTableOutput']> = jest.fn()

	it('uses tableFieldDefinitions when specified', async () => {
		const config: FormatAndWriteItemConfig<SimpleType> = {
			tableFieldDefinitions: [],
		}

		const commonFormatter: jest.Mock<OutputFormatter<SimpleType>> = jest.fn()
		itemTableFormatterMock.mockReturnValue(commonFormatter)

		await formatAndWriteItem(command, config, item, 'common')

		expect(itemTableFormatterMock).toHaveBeenCalledTimes(1)
		expect(itemTableFormatterMock).toHaveBeenCalledWith(command.tableGenerator, config.tableFieldDefinitions)
		expect(buildOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(buildOutputFormatterMock).toHaveBeenCalledWith(flags, cliConfig, 'common', commonFormatter)
		expect(outputFormatterMock).toHaveBeenCalledTimes(1)
		expect(outputFormatterMock).toHaveBeenCalledWith(item)
		expect(writeOutputMock).toHaveBeenCalledTimes(1)
		expect(writeOutputMock).toHaveBeenCalledWith('output', 'output.yaml')
	})

	it('uses buildTableOutput when specified', async () => {
		const config: FormatAndWriteItemConfig<SimpleType> = {
			buildTableOutput: buildTableOutputMock,
		}

		await formatAndWriteItem<SimpleType>(command, config, item, 'json')

		expect(itemTableFormatterMock).toHaveBeenCalledTimes(0)
		expect(buildOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(buildOutputFormatterMock).toHaveBeenCalledWith(flags, cliConfig, 'json', expect.anything())
		expect(outputFormatterMock).toHaveBeenCalledTimes(1)
		expect(outputFormatterMock).toHaveBeenCalledWith(item)
		expect(writeOutputMock).toHaveBeenCalledTimes(1)
		expect(writeOutputMock).toHaveBeenCalledWith('output', 'output.yaml')

		// Call the OutputFormatter that was build to ensure it uses `buildTableOutput`
		const commonFormatter = buildOutputFormatterMock.mock.calls[0][3] as OutputFormatter<SimpleType>
		buildTableOutputMock.mockReturnValue('common output')
		expect(commonFormatter(item)).toBe('common output')
		expect(buildTableOutputMock).toHaveBeenCalledTimes(1)
	})

	it('uses buildTableOutput when both specified', async () => {
		const config: FormatAndWriteItemConfig<SimpleType> = {
			tableFieldDefinitions: [],
			buildTableOutput: buildTableOutputMock,
		}

		await formatAndWriteItem<SimpleType>(command, config, item, 'json')

		expect(itemTableFormatterMock).toHaveBeenCalledTimes(0)
		expect(buildOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(buildOutputFormatterMock).toHaveBeenCalledWith(flags, cliConfig, 'json', expect.anything())
		expect(outputFormatterMock).toHaveBeenCalledTimes(1)
		expect(outputFormatterMock).toHaveBeenCalledWith(item)
		expect(writeOutputMock).toHaveBeenCalledTimes(1)
		expect(writeOutputMock).toHaveBeenCalledWith('output', 'output.yaml')

		// Call the OutputFormatter that was build to ensure it uses `buildTableOutput`
		const commonFormatter = buildOutputFormatterMock.mock.calls[0][3] as OutputFormatter<SimpleType>
		buildTableOutputMock.mockReturnValue('common output')
		expect(commonFormatter(item)).toBe('common output')
		expect(buildTableOutputMock).toHaveBeenCalledTimes(1)
	})
})

describe('formatAndWriteList', () => {
	// For the list tests, we need arrays of `SimpleType` rather than just
	// `SimpleType` for `buildOutputFormatter`'s generic.
	const listBuildOutputFormatterMock =
		buildOutputFormatterMock as unknown as jest.Mock<typeof buildOutputFormatter<SimpleType[]>>
	const buildListTableOutputMock: jest.Mock<CustomCommonListOutputProducer<SimpleType>['buildListTableOutput']> = jest.fn()

	it('returns no items found when none found', async () => {
		const config: FormatAndWriteListConfig<SimpleType> = {
			buildListTableOutput: buildListTableOutputMock,
			primaryKeyName: 'num',
		}

		await formatAndWriteList<SimpleType>(command, config, [], true)

		expect(listTableFormatterMock).toHaveBeenCalledTimes(0)
		expect(listBuildOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(listBuildOutputFormatterMock).toHaveBeenCalledWith(flags, cliConfig, undefined, expect.anything())
		expect(outputFormatterMock).toHaveBeenCalledTimes(1)
		expect(outputFormatterMock).toHaveBeenCalledWith([])
		expect(writeOutputMock).toHaveBeenCalledTimes(1)
		expect(writeOutputMock).toHaveBeenCalledWith('output', 'output.yaml')

		// Call the OutputFormatter that was build to ensure it uses `buildTableOutput`
		const commonFormatter = listBuildOutputFormatterMock.mock.calls[0][3]
		expect(commonFormatter?.(list)).toBe('no items found')
	})

	it('returns no items found when none found; name specified', async () => {
		const config: FormatAndWriteListConfig<SimpleType> = {
			buildListTableOutput: buildListTableOutputMock,
			itemName: 'thing',
			primaryKeyName: 'num',
		}

		await formatAndWriteList<SimpleType>(command, config, [], true)

		expect(listTableFormatterMock).toHaveBeenCalledTimes(0)
		expect(listBuildOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(listBuildOutputFormatterMock).toHaveBeenCalledWith(flags, cliConfig, undefined, expect.anything())
		expect(outputFormatterMock).toHaveBeenCalledTimes(1)
		expect(outputFormatterMock).toHaveBeenCalledWith([])
		expect(writeOutputMock).toHaveBeenCalledTimes(1)
		expect(writeOutputMock).toHaveBeenCalledWith('output', 'output.yaml')

		// Call the OutputFormatter that was build to ensure it uses `buildTableOutput`
		const commonFormatter = listBuildOutputFormatterMock.mock.calls[0][3] as OutputFormatter<SimpleType[]>
		expect(commonFormatter(list)).toBe('no things found')
	})

	it('returns no items found when none found; plural name specified', async () => {
		const config: FormatAndWriteListConfig<SimpleType> = {
			buildListTableOutput: buildListTableOutputMock,
			pluralItemName: 'candies',
			primaryKeyName: 'num',
		}

		await formatAndWriteList<SimpleType>(command, config, [], true)

		expect(listTableFormatterMock).toHaveBeenCalledTimes(0)
		expect(listBuildOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(listBuildOutputFormatterMock).toHaveBeenCalledWith(flags, cliConfig, undefined, expect.anything())
		expect(outputFormatterMock).toHaveBeenCalledTimes(1)
		expect(outputFormatterMock).toHaveBeenCalledWith([])
		expect(writeOutputMock).toHaveBeenCalledTimes(1)
		expect(writeOutputMock).toHaveBeenCalledWith('output', 'output.yaml')

		// Call the OutputFormatter that was build to ensure it uses `buildTableOutput`
		const commonFormatter = listBuildOutputFormatterMock.mock.calls[0][3] as OutputFormatter<SimpleType[]>
		expect(commonFormatter(list)).toBe('no candies found')
	})

	it('uses listTableFieldDefinitions when specified', async () => {
		const config: FormatAndWriteListConfig<SimpleType> = {
			listTableFieldDefinitions: [],
			primaryKeyName: 'num',
		}

		const commonFormatter: jest.Mock<OutputFormatter<SimpleType[]>> = jest.fn()
		listTableFormatterMock.mockReturnValue(commonFormatter)

		await formatAndWriteList(command, config, list)

		expect(listTableFormatterMock).toHaveBeenCalledTimes(1)
		expect(listTableFormatterMock).toHaveBeenCalledWith(command.tableGenerator, config.listTableFieldDefinitions, false)
		expect(listBuildOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(listBuildOutputFormatterMock).toHaveBeenCalledWith(flags, cliConfig, undefined, commonFormatter)
		expect(outputFormatterMock).toHaveBeenCalledTimes(1)
		expect(outputFormatterMock).toHaveBeenCalledWith(list)
		expect(writeOutputMock).toHaveBeenCalledTimes(1)
		expect(writeOutputMock).toHaveBeenCalledWith('output', 'output.yaml')
	})

	it('uses buildListTableOutput when specified', async () => {
		const config: FormatAndWriteListConfig<SimpleType> = {
			buildListTableOutput: buildListTableOutputMock,
			primaryKeyName: 'num',
		}

		await formatAndWriteList<SimpleType>(command, config, list, true)

		expect(listTableFormatterMock).toHaveBeenCalledTimes(0)
		expect(listBuildOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(listBuildOutputFormatterMock).toHaveBeenCalledWith(flags, cliConfig, undefined, expect.anything())
		expect(outputFormatterMock).toHaveBeenCalledTimes(1)
		expect(outputFormatterMock).toHaveBeenCalledWith(list)
		expect(writeOutputMock).toHaveBeenCalledTimes(1)
		expect(writeOutputMock).toHaveBeenCalledWith('output', 'output.yaml')

		// Call the OutputFormatter that was build to ensure it uses `buildTableOutput`
		const commonFormatter = listBuildOutputFormatterMock.mock.calls[0][3] as OutputFormatter<SimpleType[]>
		buildListTableOutputMock.mockReturnValue('common output')
		expect(commonFormatter(list)).toBe('common output')
		expect(buildListTableOutputMock).toHaveBeenCalledTimes(1)
	})

	it('uses buildListTableOutput when both specified', async () => {
		const config: FormatAndWriteListConfig<SimpleType> = {
			listTableFieldDefinitions: [],
			buildListTableOutput: buildListTableOutputMock,
			primaryKeyName: 'num',
		}

		await formatAndWriteList<SimpleType>(command, config, list, true)

		expect(listTableFormatterMock).toHaveBeenCalledTimes(0)
		expect(listBuildOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(listBuildOutputFormatterMock).toHaveBeenCalledWith(flags, cliConfig, undefined, expect.anything())
		expect(outputFormatterMock).toHaveBeenCalledTimes(1)
		expect(outputFormatterMock).toHaveBeenCalledWith(list)
		expect(writeOutputMock).toHaveBeenCalledTimes(1)
		expect(writeOutputMock).toHaveBeenCalledWith('output', 'output.yaml')

		// Call the OutputFormatter that was build to ensure it uses `buildTableOutput`
		const commonFormatter = listBuildOutputFormatterMock.mock.calls[0][3] as OutputFormatter<SimpleType[]>
		buildListTableOutputMock.mockReturnValue('common output')
		expect(commonFormatter(list)).toBe('common output')
		expect(buildListTableOutputMock).toHaveBeenCalledTimes(1)
	})

	it('uses Sorting fields as a fallback', async () => {
		const config: CommonListOutputProducer<SimpleType> & Naming = {
			primaryKeyName: 'num',
			sortKeyName: 'str',
		}

		const commonFormatter: jest.Mock<OutputFormatter<SimpleType[]>> = jest.fn()
		listTableFormatterMock.mockReturnValue(commonFormatter)

		await formatAndWriteList(command, config, list)

		expect(listTableFormatterMock).toHaveBeenCalledTimes(1)
		expect(listTableFormatterMock).toHaveBeenCalledWith(command.tableGenerator, ['str', 'num'], false)
		expect(listBuildOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(listBuildOutputFormatterMock).toHaveBeenCalledWith(flags, cliConfig, undefined, commonFormatter)
		expect(outputFormatterMock).toHaveBeenCalledTimes(1)
		expect(outputFormatterMock).toHaveBeenCalledWith(list)
		expect(writeOutputMock).toHaveBeenCalledTimes(1)
		expect(writeOutputMock).toHaveBeenCalledWith('output', 'output.yaml')
	})

	it('writes common formatted output to stdout when forUserQuery specified', async () => {
		const config: TableCommonListOutputProducer<SimpleType> = {
			listTableFieldDefinitions: [],
			primaryKeyName: 'num',
		}

		const commonFormatter: jest.Mock<OutputFormatter<SimpleType[]>> = jest.fn()
		commonFormatter.mockReturnValue('common output')
		listTableFormatterMock.mockReturnValue(commonFormatter)

		await formatAndWriteList(command, config, list, false, true)

		expect(listTableFormatterMock).toHaveBeenCalledTimes(1)
		expect(listTableFormatterMock).toHaveBeenCalledWith(command.tableGenerator, config.listTableFieldDefinitions, false)
		expect(listBuildOutputFormatterMock).toHaveBeenCalledTimes(0)
		expect(outputFormatterMock).toHaveBeenCalledTimes(0)
		expect(commonFormatter).toHaveBeenCalledTimes(1)
		expect(commonFormatter).toHaveBeenCalledWith(list)
		expect(writeOutputMock).toHaveBeenCalledTimes(1)
		expect(writeOutputMock).toHaveBeenCalledWith('common output', undefined)
	})
})
