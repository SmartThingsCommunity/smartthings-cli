import { TableGenerator } from '../../../lib/table-generator.js'
import { Naming } from '../../../lib/command/basic-io.js'
import { CommonListOutputProducer, formatAndWriteItem, formatAndWriteList } from '../../../lib/command/format.js'
import { OutputFormatter, itemTableFormatter, listTableFormatter, writeOutput } from '../../../lib/command/output.js'
import { buildOutputFormatter, BuildOutputFormatterFlags } from '../../../lib/command/output-builder.js'
import { SmartThingsCommand } from '../../../lib/command/smartthings-command.js'
import { SimpleType } from '../../test-lib/simple-type.js'


jest.mock('../../../lib/command/output.js')
jest.mock('../../../lib/command/output-builder.js')


const item = { str: 'string', num: 5 }
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

const outputFormatter: jest.Mock<string, [data: unknown]> = jest.fn().mockReturnValue('output')
const buildOutputFormatterMock = jest.mocked(buildOutputFormatter).mockReturnValue(outputFormatter)
const writeOutputMock = jest.mocked(writeOutput).mockResolvedValue()

describe('formatAndWriteItem', () => {
	const itemTableFormatterMock = jest.mocked(itemTableFormatter)

	it('uses tableFieldDefinitions when specified', async () => {
		const config = {
			tableFieldDefinitions: [],
		}

		const commonFormatter = jest.fn()
		itemTableFormatterMock.mockReturnValue(commonFormatter)

		await formatAndWriteItem(command, config, item, 'common')

		expect(itemTableFormatterMock).toHaveBeenCalledTimes(1)
		expect(itemTableFormatterMock).toHaveBeenCalledWith(command.tableGenerator, config.tableFieldDefinitions)
		expect(buildOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(buildOutputFormatterMock).toHaveBeenCalledWith(flags, cliConfig, 'common', commonFormatter)
		expect(outputFormatter).toHaveBeenCalledTimes(1)
		expect(outputFormatter).toHaveBeenCalledWith(item)
		expect(writeOutputMock).toHaveBeenCalledTimes(1)
		expect(writeOutputMock).toHaveBeenCalledWith('output', 'output.yaml')
	})

	it('uses buildTableOutput when specified', async () => {
		const config = {
			buildTableOutput: jest.fn(),
		}

		await formatAndWriteItem<SimpleType>(command, config, item, 'json')

		expect(itemTableFormatterMock).toHaveBeenCalledTimes(0)
		expect(buildOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(buildOutputFormatterMock).toHaveBeenCalledWith(flags, cliConfig, 'json', expect.anything())
		expect(outputFormatter).toHaveBeenCalledTimes(1)
		expect(outputFormatter).toHaveBeenCalledWith(item)
		expect(writeOutputMock).toHaveBeenCalledTimes(1)
		expect(writeOutputMock).toHaveBeenCalledWith('output', 'output.yaml')

		// Call the OutputFormatter that was build to ensure it uses `buildTableOutput`
		const commonFormatter = buildOutputFormatterMock.mock.calls[0][3] as OutputFormatter<SimpleType>
		config.buildTableOutput.mockReturnValue('common output')
		expect(commonFormatter(item)).toBe('common output')
		expect(config.buildTableOutput).toHaveBeenCalledTimes(1)
	})

	it('uses buildTableOutput when both specified', async () => {
		const config = {
			tableFieldDefinitions: [],
			buildTableOutput: jest.fn(),
		}

		await formatAndWriteItem<SimpleType>(command, config, item, 'json')

		expect(itemTableFormatterMock).toHaveBeenCalledTimes(0)
		expect(buildOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(buildOutputFormatterMock).toHaveBeenCalledWith(flags, cliConfig, 'json', expect.anything())
		expect(outputFormatter).toHaveBeenCalledTimes(1)
		expect(outputFormatter).toHaveBeenCalledWith(item)
		expect(writeOutputMock).toHaveBeenCalledTimes(1)
		expect(writeOutputMock).toHaveBeenCalledWith('output', 'output.yaml')

		// Call the OutputFormatter that was build to ensure it uses `buildTableOutput`
		const commonFormatter = buildOutputFormatterMock.mock.calls[0][3] as OutputFormatter<SimpleType>
		config.buildTableOutput.mockReturnValue('common output')
		expect(commonFormatter(item)).toBe('common output')
		expect(config.buildTableOutput).toHaveBeenCalledTimes(1)
	})
})

describe('formatAndWriteList', () => {
	const listTableFormatterMock = jest.mocked(listTableFormatter)

	it('returns no items found when none found', async () => {
		const config = {
			buildListTableOutput: jest.fn(),
		}

		await formatAndWriteList<SimpleType>(command, config, [], true)

		expect(listTableFormatterMock).toHaveBeenCalledTimes(0)
		expect(buildOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(buildOutputFormatterMock).toHaveBeenCalledWith(flags, cliConfig, undefined, expect.anything())
		expect(outputFormatter).toHaveBeenCalledTimes(1)
		expect(outputFormatter).toHaveBeenCalledWith([])
		expect(writeOutputMock).toHaveBeenCalledTimes(1)
		expect(writeOutputMock).toHaveBeenCalledWith('output', 'output.yaml')

		// Call the OutputFormatter that was build to ensure it uses `buildTableOutput`
		const commonFormatter = buildOutputFormatterMock.mock.calls[0][3] as OutputFormatter<SimpleType[]>
		expect(commonFormatter(list)).toBe('no items found')
	})

	it('returns no items found when none found; name specified', async () => {
		const config = {
			buildListTableOutput: jest.fn(),
			itemName: 'thing',
		}

		await formatAndWriteList<SimpleType>(command, config, [], true)

		expect(listTableFormatterMock).toHaveBeenCalledTimes(0)
		expect(buildOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(buildOutputFormatterMock).toHaveBeenCalledWith(flags, cliConfig, undefined, expect.anything())
		expect(outputFormatter).toHaveBeenCalledTimes(1)
		expect(outputFormatter).toHaveBeenCalledWith([])
		expect(writeOutputMock).toHaveBeenCalledTimes(1)
		expect(writeOutputMock).toHaveBeenCalledWith('output', 'output.yaml')

		// Call the OutputFormatter that was build to ensure it uses `buildTableOutput`
		const commonFormatter = buildOutputFormatterMock.mock.calls[0][3] as OutputFormatter<SimpleType[]>
		expect(commonFormatter(list)).toBe('no things found')
	})

	it('returns no items found when none found; plural name specified', async () => {
		const config = {
			buildListTableOutput: jest.fn(),
			pluralItemName: 'candies',
		}

		await formatAndWriteList<SimpleType>(command, config, [], true)

		expect(listTableFormatterMock).toHaveBeenCalledTimes(0)
		expect(buildOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(buildOutputFormatterMock).toHaveBeenCalledWith(flags, cliConfig, undefined, expect.anything())
		expect(outputFormatter).toHaveBeenCalledTimes(1)
		expect(outputFormatter).toHaveBeenCalledWith([])
		expect(writeOutputMock).toHaveBeenCalledTimes(1)
		expect(writeOutputMock).toHaveBeenCalledWith('output', 'output.yaml')

		// Call the OutputFormatter that was build to ensure it uses `buildTableOutput`
		const commonFormatter = buildOutputFormatterMock.mock.calls[0][3] as OutputFormatter<SimpleType[]>
		expect(commonFormatter(list)).toBe('no candies found')
	})

	it('uses listTableFieldDefinitions when specified', async () => {
		const config = {
			listTableFieldDefinitions: [],
		}

		const commonFormatter = jest.fn()
		listTableFormatterMock.mockReturnValue(commonFormatter)

		await formatAndWriteList(command, config, list)

		expect(listTableFormatterMock).toHaveBeenCalledTimes(1)
		expect(listTableFormatterMock).toHaveBeenCalledWith(command.tableGenerator, config.listTableFieldDefinitions, false)
		expect(buildOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(buildOutputFormatterMock).toHaveBeenCalledWith(flags, cliConfig, undefined, commonFormatter)
		expect(outputFormatter).toHaveBeenCalledTimes(1)
		expect(outputFormatter).toHaveBeenCalledWith(list)
		expect(writeOutputMock).toHaveBeenCalledTimes(1)
		expect(writeOutputMock).toHaveBeenCalledWith('output', 'output.yaml')
	})

	it('uses buildListTableOutput when specified', async () => {
		const config = {
			buildListTableOutput: jest.fn(),
		}

		await formatAndWriteList<SimpleType>(command, config, list, true)

		expect(listTableFormatterMock).toHaveBeenCalledTimes(0)
		expect(buildOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(buildOutputFormatterMock).toHaveBeenCalledWith(flags, cliConfig, undefined, expect.anything())
		expect(outputFormatter).toHaveBeenCalledTimes(1)
		expect(outputFormatter).toHaveBeenCalledWith(list)
		expect(writeOutputMock).toHaveBeenCalledTimes(1)
		expect(writeOutputMock).toHaveBeenCalledWith('output', 'output.yaml')

		// Call the OutputFormatter that was build to ensure it uses `buildTableOutput`
		const commonFormatter = buildOutputFormatterMock.mock.calls[0][3] as OutputFormatter<SimpleType[]>
		config.buildListTableOutput.mockReturnValue('common output')
		expect(commonFormatter(list)).toBe('common output')
		expect(config.buildListTableOutput).toHaveBeenCalledTimes(1)
	})

	it('uses buildListTableOutput when both specified', async () => {
		const config = {
			listTableFieldDefinitions: [],
			buildListTableOutput: jest.fn(),
		}

		await formatAndWriteList<SimpleType>(command, config, list, true)

		expect(listTableFormatterMock).toHaveBeenCalledTimes(0)
		expect(buildOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(buildOutputFormatterMock).toHaveBeenCalledWith(flags, cliConfig, undefined, expect.anything())
		expect(outputFormatter).toHaveBeenCalledTimes(1)
		expect(outputFormatter).toHaveBeenCalledWith(list)
		expect(writeOutputMock).toHaveBeenCalledTimes(1)
		expect(writeOutputMock).toHaveBeenCalledWith('output', 'output.yaml')

		// Call the OutputFormatter that was build to ensure it uses `buildTableOutput`
		const commonFormatter = buildOutputFormatterMock.mock.calls[0][3] as OutputFormatter<SimpleType[]>
		config.buildListTableOutput.mockReturnValue('common output')
		expect(commonFormatter(list)).toBe('common output')
		expect(config.buildListTableOutput).toHaveBeenCalledTimes(1)
	})

	it('uses Sorting fields as a fallback', async () => {
		const config: CommonListOutputProducer<SimpleType> & Naming = {
			primaryKeyName: 'num',
			sortKeyName: 'str',
		}

		const commonFormatter = jest.fn()
		listTableFormatterMock.mockReturnValue(commonFormatter)

		await formatAndWriteList(command, config, list)

		expect(listTableFormatterMock).toHaveBeenCalledTimes(1)
		expect(listTableFormatterMock).toHaveBeenCalledWith(command.tableGenerator, ['str', 'num'], false)
		expect(buildOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(buildOutputFormatterMock).toHaveBeenCalledWith(flags, cliConfig, undefined, commonFormatter)
		expect(outputFormatter).toHaveBeenCalledTimes(1)
		expect(outputFormatter).toHaveBeenCalledWith(list)
		expect(writeOutputMock).toHaveBeenCalledTimes(1)
		expect(writeOutputMock).toHaveBeenCalledWith('output', 'output.yaml')
	})

	it('writes common formatted output to stdout when forUserQuery specified', async () => {
		const config = {
			listTableFieldDefinitions: [],
		}

		const commonFormatter = jest.fn().mockReturnValue('common output')
		listTableFormatterMock.mockReturnValue(commonFormatter)

		await formatAndWriteList(command, config, list, false, true)

		expect(listTableFormatterMock).toHaveBeenCalledTimes(1)
		expect(listTableFormatterMock).toHaveBeenCalledWith(command.tableGenerator, config.listTableFieldDefinitions, false)
		expect(buildOutputFormatterMock).toHaveBeenCalledTimes(0)
		expect(outputFormatter).toHaveBeenCalledTimes(0)
		expect(commonFormatter).toHaveBeenCalledTimes(1)
		expect(commonFormatter).toHaveBeenCalledWith(list)
		expect(writeOutputMock).toHaveBeenCalledTimes(1)
		expect(writeOutputMock).toHaveBeenCalledWith('common output', undefined)
	})
})
