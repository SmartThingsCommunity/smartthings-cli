import { jest } from '@jest/globals'

import type {
	selectFromList,
	SelectFromListConfig,
	SelectFromListFlags,
} from '../../../../lib/command/select.js'
import type { APICommand } from '../../../../lib/command/api-command.js'
import type { stringTranslateToId } from '../../../../lib/command/command-util.js'
import type { ListItemPredicate, ChooseOptions, CreateChooseFunctionOptions } from '../../../../lib/command/util/util-util.js'
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
		const config = { someOtherKey: 'some other value' } as Partial<ChooseOptions<{ someOtherKey: string }>>
		expect(chooseOptionsWithDefaults(config)).toEqual(expect.objectContaining(config))
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
		const itemListMock = jest.fn<Parameters<typeof createChooseFn<SimpleType>>[1]>()
			.mockResolvedValue(itemList)
		const chooseSimpleType = createChooseFn(config, itemListMock)

		it('sets default for passed options', async () => {
			expect(await chooseSimpleType(command, undefined, {})).toBe('selected-simple-type-id')

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

		it('uses listItems from createChooseFn by default', async () => {
			expect(await chooseSimpleType(command)).toBe('selected-simple-type-id')

			expect(itemListMock).toHaveBeenCalledExactlyOnceWith(command)

			const listItems = selectFromListMock.mock.calls[0][2].listItems

			// The internal function should not result in more API calls, no matter how many times it's called.
			expect(await listItems()).toBe(itemList)
			expect(await listItems()).toBe(itemList)

			expect(itemListMock).toHaveBeenCalledExactlyOnceWith(command)
		})

		it('overrides listItems from createChooseFn with one from options when specified', async () => {
			const overridingListItemsMock = jest.fn<Required<ChooseOptions<SimpleType>>['listItems']>()
				.mockResolvedValueOnce(itemList)
			expect(await chooseSimpleType(command, undefined, { listItems: overridingListItemsMock }))
				.toBe('selected-simple-type-id')

			expect(overridingListItemsMock).toHaveBeenCalledExactlyOnceWith(command)
			expect(itemListMock).not.toHaveBeenCalled()

			const listItems = selectFromListMock.mock.calls[0][2].listItems

			// The internal function should not result in more API calls, no matter how many times it's called.
			expect(await listItems()).toBe(itemList)
			expect(await listItems()).toBe(itemList)

			expect(overridingListItemsMock).toHaveBeenCalledExactlyOnceWith(command)
			expect(itemListMock).not.toHaveBeenCalled()
		})

		it('throws error when `useConfigDefault` is used when no default is set up', async () => {
			await expect(chooseSimpleType(command, undefined, { useConfigDefault: true })).rejects.toThrow()
		})

		const getItemMock = jest.fn<Required<CreateChooseFunctionOptions<SimpleType>>['defaultValue']['getItem']>()
			.mockResolvedValue(item1)
		const userMessageMock = jest.fn<Required<CreateChooseFunctionOptions<SimpleType>>['defaultValue']['userMessage']>()
		const chooseSimpleTypeWithDefaultConfig = createChooseFn(
			config,
			itemListMock,
			{
				defaultValue: {
					configKey: '',
					getItem: getItemMock,
					userMessage: userMessageMock,
				},
			},
		)

		it('passes default config options to selectFromList when configured and requested', async () => {
			expect(await chooseSimpleTypeWithDefaultConfig(command, undefined, { useConfigDefault: true }))
				.toBe('selected-simple-type-id')

			expect(selectFromListMock).toHaveBeenCalledExactlyOnceWith(
				command,
				config,
				expect.objectContaining({
					defaultValue: {
						configKey: '',
						getItem: expect.any(Function),
						userMessage: userMessageMock,
					},
				}),
			)

			const getItem = selectFromListMock.mock.calls[0][2].defaultValue?.getItem

			expect(getItem).toBeDefined()
			expect(await getItem?.('input-id')).toBe(item1)

			expect(getItemMock).toHaveBeenCalledExactlyOnceWith(command, 'input-id')
		})

		it('passes customNotFoundMessage option on to select', async () => {
			const chooseSimpleType = createChooseFn(config, itemListMock, { customNotFoundMessage: 'custom not found' })
			expect(await chooseSimpleType(command, undefined)).toBe('selected-simple-type-id')

			expect(selectFromListMock).toHaveBeenCalledExactlyOnceWith(
				command,
				config,
				expect.objectContaining({ customNotFoundMessage: 'custom not found' }),
			)
		})
	})
})
