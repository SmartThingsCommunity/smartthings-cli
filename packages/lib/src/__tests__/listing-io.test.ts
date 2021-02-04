import * as basicIO from '../basic-io'
import * as commandUtil from '../command-util'
import { outputGenericListing, outputListing } from '../listing-io'
import { buildMockCommand } from './test-lib/mock-command'
import { SimpleType } from './test-lib/simple-type'


describe('listing-io', () => {
	const item = { str: 'string-id', num: 5 }
	const list = [item]
	const command = {
		...buildMockCommand(),
		flags: {
			output: 'output.yaml',
		},
	}
	const config = {
		tableFieldDefinitions: [],
		primaryKeyName: 'str',
		sortKeyName: 'num',
	}

	const getFunction = jest.fn().mockResolvedValue(item)
	const listFunction = jest.fn()
	const outputItemSpy = jest.spyOn(basicIO, 'outputItem')
	const outputListSpy = jest.spyOn(basicIO, 'outputList')
	const translateToId = jest.fn().mockResolvedValue('translated id')

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('outputGenericListing', () => {
		it('calls outputItem when given idOrIndex', async () => {
			outputItemSpy.mockResolvedValue(item)

			await outputGenericListing<string, SimpleType, SimpleType>(command, config, 'id or index',
				listFunction, getFunction, translateToId, false)

			expect(translateToId).toHaveBeenCalledTimes(1)
			expect(translateToId).toHaveBeenCalledWith('id or index', listFunction)
			expect(outputItemSpy).toHaveBeenCalledTimes(1)
			expect(outputItemSpy).toHaveBeenCalledWith(command, config, expect.anything())

			expect(getFunction).toHaveBeenCalledTimes(0)
			expect(listFunction).toHaveBeenCalledTimes(0)
			expect(outputListSpy).toHaveBeenCalledTimes(0)

			const getCaller: () => Promise<SimpleType> = outputItemSpy.mock.calls[0][2] as never
			const getCallerResult = await getCaller()

			expect(getCallerResult).toBe(item)
			expect(getFunction).toHaveBeenCalledTimes(1)
			expect(getFunction).toHaveBeenCalledWith('translated id')
		})

		it('calls outputList when not given idOrIndex', async () => {
			outputListSpy.mockResolvedValue(list)

			await outputGenericListing<string, SimpleType, SimpleType>(command, config, undefined,
				listFunction, getFunction, translateToId)

			expect(outputListSpy).toHaveBeenCalledTimes(1)
			expect(outputListSpy).toHaveBeenCalledWith(command, config, listFunction, true)

			expect(translateToId).toHaveBeenCalledTimes(0)
			expect(getFunction).toHaveBeenCalledTimes(0)
			expect(listFunction).toHaveBeenCalledTimes(0)
			expect(outputItemSpy).toHaveBeenCalledTimes(0)
		})
	})

	describe('outputListing', () => {
		const translateToIdSpy = jest.spyOn(commandUtil, 'stringTranslateToId').mockResolvedValue('id or index')

		it('calls outputItem when given an id', async () => {
			outputItemSpy.mockResolvedValue(item)

			await outputListing(command, config, 'id or index', listFunction, getFunction)

			expect(translateToIdSpy).toHaveBeenCalledTimes(1)
			expect(translateToIdSpy).toHaveBeenCalledWith(config, 'id or index', listFunction)
			expect(outputItemSpy).toHaveBeenCalledTimes(1)
			expect(outputItemSpy).toHaveBeenCalledWith(command, config, expect.anything())

			expect(getFunction).toHaveBeenCalledTimes(0)
			expect(outputListSpy).toHaveBeenCalledTimes(0)

			const getCaller: () => Promise<SimpleType> = outputItemSpy.mock.calls[0][2] as never
			const getCallerResult = await getCaller()

			expect(getCallerResult).toBe(item)
			expect(getFunction).toHaveBeenCalledTimes(1)
			expect(getFunction).toHaveBeenCalledWith('id or index')
		})

		it('calls outputList when not given idOrIndex', async () => {
			outputListSpy.mockResolvedValue(list)

			await outputListing(command, config, undefined, listFunction, getFunction, true)

			expect(outputListSpy).toHaveBeenCalledTimes(1)
			expect(outputListSpy).toHaveBeenCalledWith(command, config, listFunction, true)

			expect(translateToIdSpy).toHaveBeenCalledTimes(0)
			expect(getFunction).toHaveBeenCalledTimes(0)
			expect(listFunction).toHaveBeenCalledTimes(0)
			expect(outputItemSpy).toHaveBeenCalledTimes(0)
		})
	})
})
