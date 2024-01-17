import { jest } from '@jest/globals'

import { OutputItemOrListConfig } from '../../../lib/command/listing-io.js'
import { SimpleType } from '../../test-lib/simple-type.js'
import { IdTranslationFunction, ListDataFunction, LookupDataFunction, outputItem, outputList, outputListBuilder } from '../../../lib/command/basic-io.js'
import { stringTranslateToId } from '../../../lib/command/command-util.js'
import { SmartThingsCommand } from '../../../lib/command/smartthings-command.js'
import { BuildOutputFormatterFlags } from '../../../lib/command/output-builder.js'


const outputItemMock: jest.Mock<typeof outputItem<SimpleType>> = jest.fn()
const outputListMock: jest.Mock<typeof outputList<SimpleType>> = jest.fn()
jest.unstable_mockModule('../../../lib/command/basic-io.js', () => ({
	outputItem: outputItemMock,
	outputList: outputListMock,
	outputListBuilder,
}))

const stringTranslateToIdMock: jest.Mock<typeof stringTranslateToId> = jest.fn()
stringTranslateToIdMock.mockResolvedValue('string translated id')
jest.unstable_mockModule('../../../lib/command/command-util.js', () => ({
	stringTranslateToId: stringTranslateToIdMock,
}))


const { outputItemOrListGeneric, outputItemOrList } = await import('../../../lib/command/listing-io.js')


const item: SimpleType = { str: 'string-id', num: 5 }
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

const getFunction: jest.Mock<LookupDataFunction<string, SimpleType>> = jest.fn()
getFunction.mockResolvedValue(item)
const listFunction: jest.Mock<ListDataFunction<SimpleType>> = jest.fn()
const translateToId: jest.Mock<IdTranslationFunction<string, SimpleType>> = jest.fn()
translateToId.mockResolvedValue('translated id')

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
	it('calls outputItem when given an id', async () => {
		outputItemMock.mockResolvedValue(item)

		await outputItemOrList(command, config, 'id or index', listFunction, getFunction)

		expect(stringTranslateToIdMock).toHaveBeenCalledTimes(1)
		expect(stringTranslateToIdMock).toHaveBeenCalledWith(config, 'id or index', listFunction)
		expect(outputItemMock).toHaveBeenCalledTimes(1)
		expect(outputItemMock).toHaveBeenCalledWith(command, config, expect.anything())

		expect(getFunction).toHaveBeenCalledTimes(0)
		expect(outputListMock).toHaveBeenCalledTimes(0)

		const getCaller = outputItemMock.mock.calls[0][2]
		const getCallerResult = await getCaller()

		expect(getCallerResult).toBe(item)
		expect(getFunction).toHaveBeenCalledTimes(1)
		expect(getFunction).toHaveBeenCalledWith('string translated id')
	})

	it('calls outputList when not given idOrIndex', async () => {
		outputListMock.mockResolvedValue(list)

		await outputItemOrList(command, config, undefined, listFunction, getFunction, true)

		expect(outputListMock).toHaveBeenCalledTimes(1)
		expect(outputListMock).toHaveBeenCalledWith(command, config, listFunction, true)

		expect(stringTranslateToIdMock).toHaveBeenCalledTimes(0)
		expect(getFunction).toHaveBeenCalledTimes(0)
		expect(listFunction).toHaveBeenCalledTimes(0)
		expect(outputItemMock).toHaveBeenCalledTimes(0)
	})
})
