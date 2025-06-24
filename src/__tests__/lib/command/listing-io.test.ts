import { jest } from '@jest/globals'

import type { OutputItemOrListConfig } from '../../../lib/command/listing-io.js'
import type { SimpleType } from '../../test-lib/simple-type.js'
import type { IdTranslationFunction, ListDataFunction, LookupDataFunction } from '../../../lib/command/io-defs.js'
import type { outputItem } from '../../../lib/command/output-item.js'
import { type outputList, outputListBuilder } from '../../../lib/command/output-list.js'
import type { stringTranslateToId } from '../../../lib/command/command-util.js'
import type { SmartThingsCommand } from '../../../lib/command/smartthings-command.js'
import type { BuildOutputFormatterFlags } from '../../../lib/command/output-builder.js'


const outputItemMock = jest.fn<typeof outputItem<SimpleType>>()
jest.unstable_mockModule('../../../lib/command/output-item.js', () => ({
	outputItem: outputItemMock,
}))

const outputListMock = jest.fn<typeof outputList<SimpleType>>()
jest.unstable_mockModule('../../../lib/command/output-list.js', () => ({
	outputList: outputListMock,
	outputListBuilder,
}))

const stringTranslateToIdMock = jest.fn<typeof stringTranslateToId>()
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

const getFunction = jest.fn<LookupDataFunction<string, SimpleType>>().mockResolvedValue(item)
const listFunction = jest.fn<ListDataFunction<SimpleType>>()
const translateToId = jest.fn<IdTranslationFunction<string, SimpleType>>()
translateToId.mockResolvedValue('translated id')

describe('outputItemOrListGeneric', () => {
	it('calls outputItem when given idOrIndex', async () => {
		outputItemMock.mockResolvedValue(item)

		await outputItemOrListGeneric<string, SimpleType, SimpleType>(command, config, 'id or index',
			listFunction, getFunction, translateToId, false)

		expect(translateToId).toHaveBeenCalledExactlyOnceWith('id or index', listFunction)
		expect(outputItemMock).toHaveBeenCalledExactlyOnceWith(command, config, expect.anything())

		expect(getFunction).not.toHaveBeenCalled()
		expect(listFunction).not.toHaveBeenCalled()
		expect(outputListMock).not.toHaveBeenCalled()

		const getCaller: () => Promise<SimpleType> = outputItemMock.mock.calls[0][2] as never
		const getCallerResult = await getCaller()

		expect(getCallerResult).toBe(item)
		expect(getFunction).toHaveBeenCalledExactlyOnceWith('translated id')
	})

	it('calls outputList when not given idOrIndex', async () => {
		outputListMock.mockResolvedValue(list)

		await outputItemOrListGeneric<string, SimpleType, SimpleType>(command, config, undefined,
			listFunction, getFunction, translateToId)

		expect(outputListMock).toHaveBeenCalledExactlyOnceWith(command, config, listFunction, { includeIndex: true })

		expect(translateToId).not.toHaveBeenCalled()
		expect(getFunction).not.toHaveBeenCalled()
		expect(listFunction).not.toHaveBeenCalled()
		expect(outputItemMock).not.toHaveBeenCalled()
	})
})

describe('outputItemOrList', () => {
	it('calls outputItem when given an id', async () => {
		outputItemMock.mockResolvedValue(item)

		await outputItemOrList(command, config, 'id or index', listFunction, getFunction)

		expect(stringTranslateToIdMock)
			.toHaveBeenCalledExactlyOnceWith(config, 'id or index', listFunction)
		expect(outputItemMock).toHaveBeenCalledExactlyOnceWith(command, config, expect.anything())

		expect(getFunction).not.toHaveBeenCalled()
		expect(outputListMock).not.toHaveBeenCalled()

		const getCaller = outputItemMock.mock.calls[0][2]
		const getCallerResult = await getCaller()

		expect(getCallerResult).toBe(item)
		expect(getFunction).toHaveBeenCalledTimes(1)
		expect(getFunction).toHaveBeenCalledWith('string translated id')
	})

	it('calls outputList when not given idOrIndex', async () => {
		outputListMock.mockResolvedValue(list)

		await outputItemOrList(command, config, undefined, listFunction, getFunction, true)

		expect(outputListMock).toHaveBeenCalledExactlyOnceWith(command, config, listFunction, { includeIndex: true })

		expect(stringTranslateToIdMock).not.toHaveBeenCalled()
		expect(getFunction).not.toHaveBeenCalled()
		expect(listFunction).not.toHaveBeenCalled()
		expect(outputItemMock).not.toHaveBeenCalled()
	})
})
