import { jest } from '@jest/globals'

import type {
	selectFromList,
	SelectFromListConfig,
	SelectFromListFlags,
} from '../../../../lib/command/select.js'
import type { APICommand } from '../../../../lib/command/api-command.js'
import type { SmartThingsClient } from '@smartthings/core-sdk'
import type { ListDataFunction } from '../../../../lib/command/basic-io.js'
import type { stringTranslateToId } from '../../../../lib/command/command-util.js'
import type { ListItemPredicate, ChooseOptions } from '../../../../lib/command/util/util-util.js'
import type { SimpleType } from '../../../test-lib/simple-type.js'


const stringTranslateToIdMock = jest.fn<typeof stringTranslateToId>()
jest.unstable_mockModule('../../../../lib/command/command-util.js', () => ({
	stringTranslateToId: stringTranslateToIdMock,
}))

const selectFromListMock = jest.fn<typeof selectFromList>()
jest.unstable_mockModule('../../../../lib/command/select.js', () => ({
	selectFromList: selectFromListMock,
}))


const {
	chooseOptionsDefaults,
	chooseOptionsWithDefaults,
	createChooseFn,
} = await import('../../../../lib/command/util/util-util.js')

describe('chooseOptionsWithDefaults', () => {
	it('uses defaults with undefined input', () => {
		expect(chooseOptionsWithDefaults(undefined)).toStrictEqual(chooseOptionsDefaults())
	})

	it('uses defaults with empty input', () => {
		expect(chooseOptionsWithDefaults({})).toStrictEqual(chooseOptionsDefaults())
	})

	it('input overrides default', () => {
		const optionsDifferentThanDefault = {
			allowIndex: true,
			verbose: true,
			useConfigDefault: true,
			autoChoose: true,
		}
		expect(chooseOptionsWithDefaults(optionsDifferentThanDefault))
			.toEqual(optionsDifferentThanDefault)
	})

	it('passes on other values unchanged', () => {
		expect(chooseOptionsWithDefaults({ someOtherKey: 'some other value' } as Partial<ChooseOptions<{ someOtherKey: string }>>))
			.toEqual(expect.objectContaining({ someOtherKey: 'some other value' }))
	})
})

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

	const command = {
		client: { notAReal: 'SmartThingsClient' },
	} as unknown as APICommand<SelectFromListFlags>

	describe('resulting function', () => {
		const itemListMock = jest.fn<(client: SmartThingsClient) => Promise<SimpleType[]>>()
			.mockResolvedValue(itemList)
		const chooseSimpleType = createChooseFn(config, itemListMock)

		it('sets default for passed options', async () => {
			const listItemsMock = jest.fn<ListDataFunction<SimpleType>>()
			const opts: Partial<ChooseOptions<SimpleType>> = { listItems: listItemsMock }

			expect(await chooseSimpleType(command, undefined, opts)).toBe('selected-simple-type-id')

			expect(listItemsMock).not.toHaveBeenCalled()
			expect(stringTranslateToIdMock).not.toHaveBeenCalled()
			expect(selectFromListMock).toHaveBeenCalledExactlyOnceWith(
				command,
				config,
				expect.objectContaining({ autoChoose: false }),
			)
		})

		it('resolves id from index when allowed', async () => {
			const opts: ChooseOptions<SimpleType> = {
				...chooseOptionsDefaults(),
				allowIndex: true,
			}

			expect(await chooseSimpleType(command, 'simple-type-from-arg', opts)).toBe('selected-simple-type-id')

			expect(stringTranslateToIdMock).toHaveBeenCalledExactlyOnceWith(
				expect.objectContaining(config),
				'simple-type-from-arg',
				expect.any(Function),
			)

			expect(selectFromListMock).toHaveBeenCalledExactlyOnceWith(
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

			expect(stringTranslateToIdMock).not.toHaveBeenCalled()
			expect(selectFromListMock).toHaveBeenCalledWith(
				command,
				config,
				expect.objectContaining({ preselectedId: 'simple-type-from-arg' }),
			)
		})

		it('uses filter when specified', async () => {
			const listFilterMock = jest.fn<ListItemPredicate<SimpleType>>()
				.mockImplementation(item => item.str !== 'string-id-b')
			const opts: Partial<ChooseOptions<SimpleType>> = {
				listFilter: listFilterMock,
			}

			expect(await chooseSimpleType(command, 'simple-type-from-arg', opts)).toBe('selected-simple-type-id')

			const listItems = selectFromListMock.mock.calls[0][2].listItems

			// The internal function should not result in more API calls, no matter how many times it's called.
			expect(await listItems()).toStrictEqual([item1, item3])
		})

		it('uses same list function for index resolution and simple type selection', async () => {
			const opts: ChooseOptions<SimpleType> = {
				...chooseOptionsDefaults(),
				allowIndex: true,
			}

			expect(await chooseSimpleType(command, 'simple-type-from-arg', opts)).toBe('selected-simple-type-id')

			expect(stringTranslateToIdMock).toHaveBeenCalledOnce()
			expect(selectFromListMock).toHaveBeenCalledOnce()

			const listFromTranslateCall = stringTranslateToIdMock.mock.calls[0][2]
			const listFromSelectCall = selectFromListMock.mock.calls[0][2].listItems

			expect(listFromTranslateCall).toBe(listFromSelectCall)
		})

		it('uses passed function to list items', async () => {
			expect(await chooseSimpleType(command)).toBe('selected-simple-type-id')

			expect(itemListMock).toHaveBeenCalledExactlyOnceWith(command.client)

			const listItems = selectFromListMock.mock.calls[0][2].listItems

			// The internal function should not result in more API calls, no matter how many times it's called.
			expect(await listItems()).toBe(itemList)
			expect(await listItems()).toBe(itemList)

			expect(itemListMock).toHaveBeenCalledExactlyOnceWith(command.client)
		})
	})
})
