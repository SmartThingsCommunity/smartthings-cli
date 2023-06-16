import { OutputItemOrListConfig, outputItemOrListGeneric, outputItemOrList } from '../../../lib/command/listing-io.js'
import { SimpleType } from '../../test-lib/simple-type.js'
import { outputItem, outputList } from '../../../lib/command/basic-io.js'
import { stringTranslateToId } from '../../../lib/command/command-util.js'
import { SmartThingsCommand } from '../../../lib/command/smartthings-command.js'
import { BuildOutputFormatterFlags } from '../../../lib/command/output-builder.js'


jest.mock('../../../lib/command/basic-io.js')
jest.mock('../../../lib/command/command-util.js')


const item = { str: 'string-id', num: 5 }
const list = [item]
const command = {
	flags: {
		output: 'output.yaml',
	},
} as SmartThingsCommand<BuildOutputFormatterFlags>
const config: OutputItemOrListConfig<SimpleType, SimpleType> = {
	tableFieldDefinitions: [],
	primaryKeyName: 'str',
	sortKeyName: 'num',
}

const getFunction = jest.fn().mockResolvedValue(item)
const listFunction = jest.fn()
const outputItemMock = jest.mocked(outputItem)
const outputListMock = jest.mocked(outputList)
const translateToId = jest.fn().mockResolvedValue('translated id')

describe('outputItemOrListGeneric', () => {
	it('calls outputItem when given idOrIndex', async () => {
		outputItemMock.mockResolvedValue(item)

		await outputItemOrListGeneric<string, SimpleType, SimpleType>(command, config, 'id or index',
			listFunction, getFunction, translateToId, false)

		expect(translateToId).toHaveBeenCalledTimes(1)
		expect(translateToId).toHaveBeenCalledWith('id or index', listFunction)
		expect(outputItemMock).toHaveBeenCalledTimes(1)
		expect(outputItemMock).toHaveBeenCalledWith(command, config, expect.anything())

		expect(getFunction).toHaveBeenCalledTimes(0)
		expect(listFunction).toHaveBeenCalledTimes(0)
		expect(outputListMock).toHaveBeenCalledTimes(0)

		const getCaller: () => Promise<SimpleType> = outputItemMock.mock.calls[0][2] as never
		const getCallerResult = await getCaller()

		expect(getCallerResult).toBe(item)
		expect(getFunction).toHaveBeenCalledTimes(1)
		expect(getFunction).toHaveBeenCalledWith('translated id')
	})

	it('calls outputList when not given idOrIndex', async () => {
		outputListMock.mockResolvedValue(list)

		await outputItemOrListGeneric<string, SimpleType, SimpleType>(command, config, undefined,
			listFunction, getFunction, translateToId)

		expect(outputListMock).toHaveBeenCalledTimes(1)
		expect(outputListMock).toHaveBeenCalledWith(command, config, listFunction, true)

		expect(translateToId).toHaveBeenCalledTimes(0)
		expect(getFunction).toHaveBeenCalledTimes(0)
		expect(listFunction).toHaveBeenCalledTimes(0)
		expect(outputItemMock).toHaveBeenCalledTimes(0)
	})
})

describe('outputItemOrList', () => {
	const translateToIdMock = jest.mocked(stringTranslateToId).mockResolvedValue('id or index')

	it('calls outputItem when given an id', async () => {
		outputItemMock.mockResolvedValue(item)

		await outputItemOrList(command, config, 'id or index', listFunction, getFunction)

		expect(translateToIdMock).toHaveBeenCalledTimes(1)
		expect(translateToIdMock).toHaveBeenCalledWith(config, 'id or index', listFunction)
		expect(outputItemMock).toHaveBeenCalledTimes(1)
		expect(outputItemMock).toHaveBeenCalledWith(command, config, expect.anything())

		expect(getFunction).toHaveBeenCalledTimes(0)
		expect(outputListMock).toHaveBeenCalledTimes(0)

		const getCaller: () => Promise<SimpleType> = outputItemMock.mock.calls[0][2] as never
		const getCallerResult = await getCaller()

		expect(getCallerResult).toBe(item)
		expect(getFunction).toHaveBeenCalledTimes(1)
		expect(getFunction).toHaveBeenCalledWith('id or index')
	})

	it('calls outputList when not given idOrIndex', async () => {
		outputListMock.mockResolvedValue(list)

		await outputItemOrList(command, config, undefined, listFunction, getFunction, true)

		expect(outputListMock).toHaveBeenCalledTimes(1)
		expect(outputListMock).toHaveBeenCalledWith(command, config, listFunction, true)

		expect(translateToIdMock).toHaveBeenCalledTimes(0)
		expect(getFunction).toHaveBeenCalledTimes(0)
		expect(listFunction).toHaveBeenCalledTimes(0)
		expect(outputItemMock).toHaveBeenCalledTimes(0)
	})
})
