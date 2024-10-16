import { jest } from '@jest/globals'

import inquirer from 'inquirer'

import { sort } from '../../../lib/command/output.js'
import { ListDataFunction, Sorting } from '../../../lib/command/io-defs.js'
import { SimpleType } from '../../test-lib/simple-type.js'


const promptMock = jest.fn<typeof inquirer.prompt>()
jest.unstable_mockModule('inquirer', () => ({
	default: {
		prompt: promptMock,
	},
}))

const sortMock = jest.fn<typeof sort>()
jest.unstable_mockModule('../../../lib/command/output.js', () => ({
	sort: sortMock,
}))


const {
	convertToId,
	isIndexArgument,
	itemName,
	pluralItemName,
	stringGetIdFromUser,
	stringTranslateToId,
} = await import('../../../lib/command/command-util.js')


describe('isIndexArgument', () => {
	const matches = ['1', '2', '9', '10', '101', '999']
	const noMatches = ['0', '01', '-1', 'apple', 'apple2', '2spooky4me']

	test.each(matches)('should return true for %s', match => {
		expect(isIndexArgument(match)).toBe(true)
	})

	test.each(noMatches)('should return false for %s', noMatch => {
		expect(isIndexArgument(noMatch)).toBe(false)
	})
})

describe('itemName', () => {
	it('uses itemName if available', () => {
		expect(itemName({ itemName: 'thing' })).toBe('thing')
	})

	it('defaults to item', () => {
		expect(itemName({})).toBe('item')
	})
})

describe('pluralItemName', () => {
	it('uses pluralItemName if available', () => {
		expect(pluralItemName({ pluralItemName: 'candies' })).toBe('candies')
	})
	it('pluralizes itemName when appropriate', () => {
		expect(pluralItemName({ itemName: 'thing' })).toBe('things')
	})
	it('defaults to items', () => {
		expect(pluralItemName({})).toBe('items')
	})
})

const item1: SimpleType = { str: 'string-id-a', num: 5 }
const item2: SimpleType = { str: 'string-id-b', num: 6 }
const item3: SimpleType = { str: 'string-id-c', num: 7 }
const list = [item1, item2, item3]
const config: Sorting<SimpleType> = {
	primaryKeyName: 'str',
	sortKeyName: 'num',
}

describe('stringTranslateToId', () => {
	const listFunction = jest.fn<ListDataFunction<SimpleType>>()

	it('simply returns undefined given undefined idOrIndex', async () => {
		const computedId = await stringTranslateToId(config, undefined, listFunction)

		expect(computedId).toBeUndefined()
		expect(listFunction).toHaveBeenCalledTimes(0)
	})

	it('simply returns id when not matching index argument', async () => {
		const computedId = await stringTranslateToId(config, 'id-not-index', listFunction)

		expect(computedId).toBe('id-not-index')
		expect(listFunction).toHaveBeenCalledTimes(0)
	})

	it('looks up item and calls outputItem when given an index', async () => {
		listFunction.mockResolvedValue(list)
		sortMock.mockReturnValue(list)

		const computedId = await stringTranslateToId(config, '1', listFunction)

		expect(computedId).toBe('string-id-a')

		expect(listFunction).toHaveBeenCalledTimes(1)
		expect(sortMock).toHaveBeenCalledExactlyOnceWith(list, 'num')
	})

	it('throws an error when item not found', async () => {
		listFunction.mockResolvedValue(list)
		sortMock.mockReturnValue(list)

		await expect(stringTranslateToId(config, '4', listFunction))
			.rejects.toThrow('invalid index 4 (enter an id or index between 1 and 3 inclusive)')

		expect(listFunction).toHaveBeenCalledTimes(1)
		expect(sortMock).toHaveBeenCalledExactlyOnceWith(list, 'num')
	})

	it('throws an error for missing primary key', async () => {
		listFunction.mockResolvedValue(list)
		sortMock.mockReturnValue([{ num: 5 }])

		await expect(stringTranslateToId(config, '1', listFunction))
			.rejects.toThrow('did not find key str in data')

		expect(listFunction).toHaveBeenCalledTimes(1)
		expect(sortMock).toHaveBeenCalledExactlyOnceWith(list, 'num')
	})

	it('throws an error for invalid type for primary key', async () => {
		listFunction.mockResolvedValue(list)
		sortMock.mockReturnValue([{ str: 3, num: 5 }])

		await expect(stringTranslateToId(config, '1', listFunction))
			.rejects.toThrow('invalid type number for primary key str in {"str":3,"num":5}')

		expect(listFunction).toHaveBeenCalledTimes(1)
		expect(sortMock).toHaveBeenCalledExactlyOnceWith(list, 'num')
	})
})

describe('convertToId', () => {
	it.each(['', 'twelve', '17', '0', '4', 'string-id-4'])('returns false for %s', async input => {
		expect(convertToId(input, 'str', list)).toBe(false)
	})

	it.each`
			input            | expectedResult
			${'string-id-a'} | ${'string-id-a'}
			${'string-id-b'} | ${'string-id-b'}
			${'string-id-c'} | ${'string-id-c'}
			${'1'}           | ${'string-id-a'}
			${'2'}           | ${'string-id-b'}
			${'3'}           | ${'string-id-c'}
	`('converts $input to $expectedResult', ({ input, expectedResult }) => {
		expect(convertToId(input, 'str', list)).toBe(expectedResult)
	})

	it('throws an error for invalid type for primary key', async () => {
		expect(() => convertToId('1', 'str', [{ str: 3, num: 5 }]))
			.toThrow('invalid type number for primary key str in {"str":3,"num":5}')
	})
})

describe('stringGetIdFromUser', () => {
	it('accepts id input from user', async () => {
		promptMock.mockResolvedValue({ itemIdOrIndex: 'string-id-a' })

		const chosenId = await stringGetIdFromUser(config, list)

		expect(chosenId).toBe('string-id-a')

		expect(promptMock).toHaveBeenCalledExactlyOnceWith({
			type: 'input', name: 'itemIdOrIndex',
			message: 'Enter id or index', validate: expect.anything(),
		})
		const validateFunction = (promptMock.mock.calls[0][0] as { validate: (input: string) => true | string }).validate

		expect(validateFunction('string-id-a')).toBe(true)
	})

	it('validation returns error when unable to convert', async () => {
		promptMock.mockResolvedValue({ itemIdOrIndex: 'string-id-a' })

		const chosenId = await stringGetIdFromUser(config, list)

		expect(chosenId).toBe('string-id-a')

		expect(promptMock).toHaveBeenCalledExactlyOnceWith({
			type: 'input', name: 'itemIdOrIndex',
			message: 'Enter id or index', validate: expect.anything(),
		})
		const validateFunction = (promptMock.mock.calls[0][0] as { validate: (input: string) => true | string }).validate

		expect(validateFunction('invalid-id')).toBe('Invalid id or index "invalid-id". Please enter an index or valid id.')
	})

	it('throws error when unable to convert entered value to a valid id', async () => {
		promptMock.mockResolvedValue({ itemIdOrIndex: 'invalid-id' })

		await expect(stringGetIdFromUser(config, list)).rejects.toThrow('unable to convert invalid-id to id')
	})

	it('handles non-default prompt', async () => {
		promptMock.mockResolvedValue({ itemIdOrIndex: 'string-id-a' })

		const chosenId = await stringGetIdFromUser(config, list, 'give me an id')

		expect(chosenId).toBe('string-id-a')

		expect(promptMock).toHaveBeenCalledExactlyOnceWith({
			type: 'input', name: 'itemIdOrIndex',
			message: 'give me an id', validate: expect.anything(),
		})
		const validateFunction = (promptMock.mock.calls[0][0] as { validate: (input: string) => true | string }).validate

		expect(validateFunction('string-id-a')).toBe(true)
	})
})
