import { jest } from '@jest/globals'

import { selectFromList, SelectFromListConfig, SelectFromListFlags } from '../../../../lib/command/select.js'
import { APICommand } from '../../../../lib/command/api-command.js'
import { SmartThingsClient } from '@smartthings/core-sdk'
import { ListDataFunction } from '../../../../lib/command/basic-io.js'
import {
	ChooseOptions,
	chooseOptionsDefaults,
	chooseOptionsWithDefaults,
	stringTranslateToId,
} from '../../../../lib/command/command-util.js'
import { SimpleType } from '../../../test-lib/simple-type.js'


const chooseOptionsWithDefaultsMock: jest.Mock<typeof chooseOptionsWithDefaults> = jest.fn()
const stringTranslateToIdMock: jest.Mock<typeof stringTranslateToId> = jest.fn()
jest.unstable_mockModule('../../../../lib/command/command-util.js', () => ({
	chooseOptionsDefaults,
	chooseOptionsWithDefaults: chooseOptionsWithDefaultsMock,
	stringTranslateToId: stringTranslateToIdMock,
}))

const selectFromListMock: jest.Mock<typeof selectFromList> = jest.fn()
jest.unstable_mockModule('../../../../lib/command/select.js', () => ({
	selectFromList: selectFromListMock,
}))


const { createChooseFn } = await import('../../../../lib/command/util/util-util.js')

describe('createChooseFn', () => {
	const item1: SimpleType = { str: 'string-id-a', num: 5 }
	const item2: SimpleType = { str: 'string-id-b', num: 6 }
	const item3: SimpleType = { str: 'string-id-c', num: 7 }
	const itemList = [item1, item2, item3]
	const config: SelectFromListConfig<SimpleType> = {
		itemName: 'simple type',
		primaryKeyName: 'str',
		sortKeyName: 'num',
	}

	it('returns a function', () => {
		expect(createChooseFn(
			config,
			async () => itemList,
		)).toEqual(expect.any(Function))
	})

	stringTranslateToIdMock.mockResolvedValue('translated-simple-type-id')
	selectFromListMock.mockResolvedValue('selected-simple-type-id')
	chooseOptionsWithDefaultsMock.mockReturnValue(chooseOptionsDefaults())

	const command = {
		client: { notAReal: 'SmartThingsClient' },
	} as unknown as APICommand<SelectFromListFlags>

	describe('resulting function', () => {
		const itemListMock = jest.fn<(client: SmartThingsClient) => Promise<SimpleType[]>>()
		const chooseSimpleType = createChooseFn(config, itemListMock)

		it('sets default for passed options', async () => {
			const listItemsMock = jest.fn<ListDataFunction<SimpleType>>()
			const opts: Partial<ChooseOptions<SimpleType>> = { listItems: listItemsMock }

			expect(await chooseSimpleType(command, undefined, opts)).toBe('selected-simple-type-id')

			expect(listItemsMock).toHaveBeenCalledTimes(0)
			expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledTimes(1)
			expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledWith(opts)
		})

		it('resolves id from index when allowed', async () => {
			const opts: ChooseOptions<SimpleType> = {
				...chooseOptionsDefaults(),
				allowIndex: true,
			}
			chooseOptionsWithDefaultsMock.mockReturnValueOnce(opts)

			expect(await chooseSimpleType(command, 'simple-type-from-arg', opts)).toBe('selected-simple-type-id')

			expect(stringTranslateToIdMock).toHaveBeenCalledTimes(1)
			expect(stringTranslateToIdMock).toHaveBeenCalledWith(
				expect.objectContaining(config),
				'simple-type-from-arg',
				expect.any(Function),
			)

			expect(selectFromListMock).toHaveBeenCalledTimes(1)
			expect(selectFromListMock).toHaveBeenCalledWith(
				command,
				config,
				expect.objectContaining({ preselectedId: 'translated-simple-type-id' }),
			)
		})

		it('uses simple type id arg when index not allowed', async () => {
			const opts: Partial<ChooseOptions<SimpleType>> = {
				allowIndex: false,
			}

			expect(await chooseSimpleType(command, 'simple-type-from-arg', opts)).toBe('selected-simple-type-id')

			expect(stringTranslateToIdMock).toHaveBeenCalledTimes(0)
			expect(selectFromListMock).toHaveBeenCalledWith(
				command,
				config,
				expect.objectContaining({ preselectedId: 'simple-type-from-arg' }),
			)
		})

		it('uses same list function for index resolution and simple type selection', async () => {
			const opts: ChooseOptions<SimpleType> = {
				...chooseOptionsDefaults(),
				allowIndex: true,
			}
			chooseOptionsWithDefaultsMock.mockReturnValueOnce(opts)

			expect(await chooseSimpleType(command, 'simple-type-from-arg', opts)).toBe('selected-simple-type-id')

			expect(stringTranslateToIdMock).toHaveBeenCalledTimes(1)
			expect(selectFromListMock).toHaveBeenCalledTimes(1)

			const listFromTranslateCall = stringTranslateToIdMock.mock.calls[0][2]
			const listFromSelectCall = selectFromListMock.mock.calls[0][2].listItems

			expect(listFromTranslateCall).toBe(listFromSelectCall)
		})

		it('uses passed function to list items', async () => {
			expect(await chooseSimpleType(command)).toBe('selected-simple-type-id')

			const listItems = selectFromListMock.mock.calls[0][2].listItems
			itemListMock.mockResolvedValueOnce(itemList)

			expect(await listItems()).toBe(itemList)

			expect(itemListMock).toHaveBeenCalledTimes(1)
			expect(itemListMock).toHaveBeenCalledWith(command.client)
		})
	})
})
