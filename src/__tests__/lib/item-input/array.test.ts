import { jest } from '@jest/globals'

import { type checkbox, type select, Separator } from '@inquirer/prompts'

import {
	addAction,
	cancelAction,
	cancelOption,
	deleteAction,
	editAction,
	finishAction,
	helpAction,
	helpOption,
	maxItemValueLength,
	uneditable,
} from '../../../lib/item-input/defs.js'
import { clipToMaximum, stringFromUnknown } from '../../../lib/util.js'
import { ArrayDefOptions, CheckboxDefOptions } from '../../../lib/item-input/array.js'
import { buildInputDefMock } from '../../test-lib/input-type-mock.js'


const checkboxMock = jest.fn<typeof checkbox>()
const selectMock = jest.fn<typeof select>()
jest.unstable_mockModule('@inquirer/prompts', () => ({
	checkbox: checkboxMock,
	select: selectMock,
	Separator,
}))

const clipToMaximumMock = jest.fn<typeof clipToMaximum>()
clipToMaximumMock.mockReturnValue('clipped')
const stringFromUnknownMock = jest.fn<typeof stringFromUnknown>()
jest.unstable_mockModule('../../../lib/util.js', () => ({
	clipToMaximum: clipToMaximumMock,
	stringFromUnknown: stringFromUnknownMock,
}))

// ignore console output
jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /*no-op*/ })


const { arrayDef, checkboxDef } = await import('../../../lib/item-input/array.js')


describe('arrayDef', () => {
	const itemDefMock = buildInputDefMock<string>('Item Def')
	const {
		buildFromUserInput: itemBuildFromUserInputMock,
		summarizeForEdit: itemSummarizeForEditMock,
		updateFromUserInput: itemUpdateFromUserInputMock,
	} = itemDefMock.mocks
	itemSummarizeForEditMock.mockImplementation(item => `summarized ${item}`)

	const def = arrayDef('Array Def', itemDefMock)

	it('uses the given name', () => {
		expect(def.name).toBe('Array Def')
	})

	describe('buildFromUserInput', () => {
		it('does not allow uneditable items', async () => {
			selectMock.mockResolvedValueOnce(addAction)
			itemBuildFromUserInputMock.mockResolvedValueOnce('entered value')
			itemSummarizeForEditMock.mockReturnValueOnce(uneditable)

			await expect(def.buildFromUserInput()).rejects
				.toThrow('The itemDef used for an arrayDef must be editable.')

			expect(itemBuildFromUserInputMock).toHaveBeenCalledTimes(1)
			expect(itemSummarizeForEditMock).toHaveBeenCalledTimes(1)
		})

		it('requires at least one item by default', async () => {
			selectMock.mockResolvedValueOnce(addAction)
			selectMock.mockResolvedValueOnce(finishAction)
			itemBuildFromUserInputMock.mockResolvedValueOnce('item1')

			expect(await def.buildFromUserInput()).toStrictEqual(['item1'])

			expect(selectMock).toHaveBeenCalledTimes(2)
			expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
				message: 'Add or edit Array Def.',
				default: addAction,
				choices: [
					{ name: 'Add Item Def.', value: addAction },
					cancelOption,
				],
			}))
			expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: expect.arrayContaining([
					{ name: 'Add Item Def.', value: addAction },
					cancelOption,
					{ name: 'Finish editing Array Def.', value: finishAction },
				]),
				default: finishAction,
			}))

			expect(itemBuildFromUserInputMock).toHaveBeenCalledExactlyOnceWith([[]])
		})

		it('does not allow duplicates by default', async () => {
			selectMock.mockResolvedValueOnce(addAction)
			itemBuildFromUserInputMock.mockResolvedValueOnce('item1')
			selectMock.mockResolvedValueOnce(addAction)
			itemBuildFromUserInputMock.mockResolvedValueOnce('item1')
			selectMock.mockResolvedValueOnce(finishAction)

			expect(await def.buildFromUserInput()).toStrictEqual(['item1'])

			expect(selectMock).toHaveBeenCalledTimes(3)
			expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
				message: 'Add or edit Array Def.',
				default: addAction,
				choices: [
					{ name: 'Add Item Def.', value: addAction },
					cancelOption,
				],
			}))
			expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: expect.arrayContaining([
					{ name: 'Add Item Def.', value: addAction },
					cancelOption,
					{ name: 'Finish editing Array Def.', value: finishAction },
				]),
				default: finishAction,
			}))
			expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: expect.arrayContaining([
					{ name: 'Add Item Def.', value: addAction },
					cancelOption,
					{ name: 'Finish editing Array Def.', value: finishAction },
				]),
				default: finishAction,
			}))

			expect(itemBuildFromUserInputMock).toHaveBeenCalledTimes(2)
			expect(itemBuildFromUserInputMock).toHaveBeenCalledWith([[]])
			expect(itemBuildFromUserInputMock).toHaveBeenCalledWith([['item1']])
		})

		it('allows duplicates if specified', async () => {
			const def = arrayDef('Array Def', itemDefMock, { allowDuplicates: true })

			selectMock.mockResolvedValueOnce(addAction)
			itemBuildFromUserInputMock.mockResolvedValueOnce('item1')
			selectMock.mockResolvedValueOnce(addAction)
			itemBuildFromUserInputMock.mockResolvedValueOnce('item1')
			selectMock.mockResolvedValueOnce(finishAction)

			expect(await def.buildFromUserInput()).toStrictEqual(['item1', 'item1'])

			expect(selectMock).toHaveBeenCalledTimes(3)
			expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
				message: 'Add or edit Array Def.',
				default: addAction,
				choices: [
					{ name: 'Add Item Def.', value: addAction },
					cancelOption,
				],
			}))
			expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: expect.arrayContaining([
					{ name: 'Add Item Def.', value: addAction },
					cancelOption,
					{ name: 'Finish editing Array Def.', value: finishAction },
				]),
				default: finishAction,
			}))
			expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: expect.arrayContaining([
					{ name: 'Add Item Def.', value: addAction },
					cancelOption,
					{ name: 'Finish editing Array Def.', value: finishAction },
				]),
				default: finishAction,
			}))

			expect(itemBuildFromUserInputMock).toHaveBeenCalledTimes(2)
			expect(itemBuildFromUserInputMock).toHaveBeenCalledWith([[]])
			expect(itemBuildFromUserInputMock).toHaveBeenCalledWith([['item1']])
		})

		it('allows many items by default', async () => {
			for (let index = 1; index <= 1000; index++) {
				selectMock.mockResolvedValueOnce(addAction)
				itemBuildFromUserInputMock.mockResolvedValueOnce(`item${index}`)
			}
			selectMock.mockResolvedValueOnce(finishAction)

			const result = await def.buildFromUserInput() as string[]
			expect(result.length).toBe(1000)

			expect(selectMock).toHaveBeenCalledTimes(1001)
			expect(itemBuildFromUserInputMock).toHaveBeenCalledTimes(1000)
		})

		it('allows empty array when asked to do so', async () => {
			const def = arrayDef('Array Def', itemDefMock, { minItems: 0 })

			selectMock.mockResolvedValueOnce(finishAction)

			expect(await def.buildFromUserInput()).toStrictEqual([])

			expect(selectMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
				message: 'Add or edit Array Def.',
				default: finishAction,
				choices: [
					{ name: 'Add Item Def.', value: addAction },
					{ name: 'Finish editing Array Def.', value: finishAction },
					cancelOption,
				],
			}))

			expect(itemBuildFromUserInputMock).not.toHaveBeenCalled()
		})

		it('requires specified minium', async () => {
			const def = arrayDef('Array Def', itemDefMock, { minItems: 2 })

			selectMock.mockResolvedValueOnce(addAction)
			selectMock.mockResolvedValueOnce(addAction)
			selectMock.mockResolvedValueOnce(finishAction)
			itemBuildFromUserInputMock.mockResolvedValueOnce('item1')
			itemBuildFromUserInputMock.mockResolvedValueOnce('item2')

			expect(await def.buildFromUserInput()).toStrictEqual(['item1', 'item2'])

			expect(selectMock).toHaveBeenCalledTimes(3)
			expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
				default: addAction,
				choices: [
					{ name: 'Add Item Def.', value: addAction },
					cancelOption,
				],
			}))
			expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: [
					{ name: 'Edit summarized item1.', value: 0 },
					expect.any(Separator),
					{ name: 'Add Item Def.', value: addAction },
					cancelOption,
				],
				default: addAction,
			}))
			expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: [
					{ name: 'Edit summarized item1.', value: 0 },
					{ name: 'Edit summarized item2.', value: 1 },
					expect.any(Separator),
					{ name: 'Add Item Def.', value: addAction },
					{ name: 'Finish editing Array Def.', value: finishAction },
					cancelOption,
				],
				default: finishAction,
			}))

			expect(itemBuildFromUserInputMock).toHaveBeenCalledTimes(2)
			expect(itemBuildFromUserInputMock).toHaveBeenCalledWith([[]])
			expect(itemBuildFromUserInputMock).toHaveBeenCalledWith([['item1']])
		})

		it('allows no more than specified maximum', async () => {
			const def = arrayDef('Array Def', itemDefMock, { maxItems: 3 })

			selectMock.mockResolvedValueOnce(addAction)
			itemBuildFromUserInputMock.mockResolvedValueOnce('item1')
			selectMock.mockResolvedValueOnce(addAction)
			itemBuildFromUserInputMock.mockResolvedValueOnce('item2')
			selectMock.mockResolvedValueOnce(addAction)
			itemBuildFromUserInputMock.mockResolvedValueOnce('item3')
			selectMock.mockResolvedValueOnce(finishAction)

			expect(await def.buildFromUserInput()).toStrictEqual(['item1', 'item2', 'item3'])

			expect(selectMock).toHaveBeenCalledTimes(4)
			expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: [
					{ name: 'Add Item Def.', value: addAction },
					cancelOption,
				],
				default: addAction,
			}))
			expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: [
					{ name: 'Edit summarized item1.', value: 0 },
					expect.any(Separator),
					{ name: 'Add Item Def.', value: addAction },
					{ name: 'Finish editing Array Def.', value: finishAction },
					cancelOption,
				],
				default: finishAction,
			}))
			expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: [
					{ name: 'Edit summarized item1.', value: 0 },
					{ name: 'Edit summarized item2.', value: 1 },
					expect.any(Separator),
					{ name: 'Add Item Def.', value: addAction },
					{ name: 'Finish editing Array Def.', value: finishAction },
					cancelOption,
				],
				default: finishAction,
			}))
			expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: [
					{ name: 'Edit summarized item1.', value: 0 },
					{ name: 'Edit summarized item2.', value: 1 },
					{ name: 'Edit summarized item3.', value: 2 },
					expect.any(Separator),
					{ name: 'Finish editing Array Def.', value: finishAction },
					cancelOption,
				],
				default: finishAction,
			}))

			expect(itemBuildFromUserInputMock).toHaveBeenCalledTimes(3)
			expect(itemBuildFromUserInputMock).toHaveBeenCalledWith([[]])
			expect(itemBuildFromUserInputMock).toHaveBeenCalledWith([['item1']])
			expect(itemBuildFromUserInputMock).toHaveBeenCalledWith([['item1', 'item2']])
		})

		it('returns cancelAction when canceled', async () => {
			selectMock.mockResolvedValueOnce(cancelAction)

			expect(await def.buildFromUserInput()).toBe(cancelAction)

			expect(selectMock).toHaveBeenCalledTimes(1)
			expect(itemBuildFromUserInputMock).not.toHaveBeenCalled()
		})

		it('throws error on invalid action', async () => {
			// This is a "should-never-happen" error that we can artificially create with mocking.
			selectMock.mockResolvedValueOnce('bad action')

			await expect(def.buildFromUserInput()).rejects.toThrow('unexpected state in arrayDef')

			expect(selectMock).toHaveBeenCalledTimes(1)
			expect(itemBuildFromUserInputMock).not.toHaveBeenCalled()
		})

		it('includes help option when helpText is supplied', async () => {
			selectMock.mockResolvedValueOnce(helpAction)
			selectMock.mockResolvedValueOnce(cancelAction)

			const def = arrayDef('Array Def', itemDefMock, { helpText: 'help text' })

			expect(await def.buildFromUserInput()).toBe(cancelAction)

			expect(selectMock).toHaveBeenCalledTimes(2)
			expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
				message: 'Add or edit Array Def.',
				default: addAction,
				choices: [
					helpOption,
					{ name: 'Add Item Def.', value: addAction },
					cancelOption,
				],
			}))

			expect(consoleLogSpy).toHaveBeenCalledWith('\nhelp text\n')
		})

		// This test tests a situation that should be impossible to get into but allows for 100% coverage. :-)
		// (Typescript can't tell that `helpText` is defined for sure but we know it is because we
		// don't even include an option for displaying help if it isn't.)
		it('logs undefined for help text in unexpected circumstance', async () => {
			// Here is where we mock something that can't happen since `helpAction` isn't included
			// when no help text is supplied.
			selectMock.mockResolvedValueOnce(helpAction)
			selectMock.mockResolvedValueOnce(cancelAction)

			const def = arrayDef('Array Def', itemDefMock)

			expect(await def.buildFromUserInput()).toBe(cancelAction)

			expect(selectMock).toHaveBeenCalledTimes(2)

			expect(consoleLogSpy).toHaveBeenCalledWith('\nundefined\n')
		})
	})

	describe('summarizeForEdit', () => {
		it('returns empty clipped string with no items', async () => {
			expect(def.summarizeForEdit([])).toBe('clipped')

			expect(clipToMaximumMock).toHaveBeenCalledExactlyOnceWith('', maxItemValueLength)
		})

		it('default summarizeForEdit uses item summarizeForEdit', async () => {
			itemSummarizeForEditMock.mockReturnValueOnce('Item 1')
			itemSummarizeForEditMock.mockReturnValueOnce('Item 2')

			expect(def.summarizeForEdit(['item1', 'item2'])).toBe('clipped')

			expect(itemSummarizeForEditMock).toHaveBeenCalledTimes(2)
			expect(itemSummarizeForEditMock).toHaveBeenCalledWith('item1')
			expect(itemSummarizeForEditMock).toHaveBeenCalledWith('item2')
			expect(clipToMaximumMock)
				.toHaveBeenCalledExactlyOnceWith('Item 1, Item 2', maxItemValueLength)
		})

		it('uses given summarizeForEdit', async () => {
			const summarizeForEdit = jest.fn<Required<ArrayDefOptions<string>>['summarizeForEdit']>()
			const def = arrayDef('Array Def', itemDefMock, { summarizeForEdit })

			expect(def.summarizeForEdit).toBe(summarizeForEdit)
		})
	})

	describe('updateFromUserInput', () => {
		// Shares code from buildFromUserInput so much of this is tested there.

		it('doesn\'t allow removal of last item by default', async () => {
			selectMock.mockResolvedValueOnce(0) // from editList
			selectMock.mockResolvedValueOnce(cancelAction) // from editItem
			selectMock.mockResolvedValueOnce(finishAction) // from editList

			expect(await def.updateFromUserInput(['item1'])).toStrictEqual(['item1'])

			expect(selectMock).toHaveBeenCalledTimes(3)
			// The prompt in editItem should have no delete option.
			expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: [
					{ name: 'Edit summarized item1.', value: editAction },
					cancelOption,
				],
				default: editAction,
			}))
			expect(itemUpdateFromUserInputMock).not.toHaveBeenCalled()
		})

		it('allows editing of an item', async () => {
			selectMock.mockResolvedValueOnce(1) // from editList
			selectMock.mockResolvedValueOnce(editAction) // from editItem
			itemUpdateFromUserInputMock.mockResolvedValueOnce('updated item2')
			selectMock.mockResolvedValueOnce(finishAction) // from editList

			expect(await def.updateFromUserInput(['item1', 'item2', 'item3']))
				.toStrictEqual(['item1', 'updated item2', 'item3'])

			expect(selectMock).toHaveBeenCalledTimes(3)
			expect(itemUpdateFromUserInputMock).toHaveBeenCalledTimes(1)
		})

		it('does not allow duplicates by default', async () => {
			selectMock.mockResolvedValueOnce(1) // from editList
			selectMock.mockResolvedValueOnce(editAction) // from editItem
			itemUpdateFromUserInputMock.mockResolvedValueOnce('item3') // `item3` is already used!
			selectMock.mockResolvedValueOnce(finishAction) // from editList

			expect(await def.updateFromUserInput(['item1', 'item2', 'item3']))
				.toStrictEqual(['item1', 'item2', 'item3'])

			expect(selectMock).toHaveBeenCalledTimes(3)
			expect(consoleLogSpy).toHaveBeenCalledWith('Duplicate values are not allowed.')
			expect(itemUpdateFromUserInputMock).toHaveBeenCalledExactlyOnceWith('item2', [])
		})

		it('always allow reentering current value even when duplicates are not allowed', async () => {
			selectMock.mockResolvedValueOnce(1) // from editList
			selectMock.mockResolvedValueOnce(editAction) // from editItem
			itemUpdateFromUserInputMock.mockResolvedValueOnce('item2') // not changing the value
			selectMock.mockResolvedValueOnce(finishAction) // from editList

			expect(await def.updateFromUserInput(['item1', 'item2', 'item3']))
				.toStrictEqual(['item1', 'item2', 'item3'])

			expect(selectMock).toHaveBeenCalledTimes(3)
			expect(consoleLogSpy).not.toHaveBeenCalled()
			expect(itemUpdateFromUserInputMock).toHaveBeenCalledExactlyOnceWith('item2', [])
		})

		it('allows duplicates if specified', async () => {
			const def = arrayDef('Array Def', itemDefMock, { allowDuplicates: true })

			selectMock.mockResolvedValueOnce(1) // from editList
			selectMock.mockResolvedValueOnce(editAction) // from editItem
			itemUpdateFromUserInputMock.mockResolvedValueOnce('item3') // `item3` is already used!
			selectMock.mockResolvedValueOnce(finishAction) // from editList

			expect(await def.updateFromUserInput(['item1', 'item2', 'item3']))
				.toStrictEqual(['item1', 'item3', 'item3'])

			expect(selectMock).toHaveBeenCalledTimes(3)
			expect(consoleLogSpy).not.toHaveBeenCalled()
			expect(itemUpdateFromUserInputMock).toHaveBeenCalledExactlyOnceWith('item2', [])
		})

		it('supports item removal', async () => {
			selectMock.mockResolvedValueOnce(1) // from editList
			selectMock.mockResolvedValueOnce(deleteAction) // from editItem
			selectMock.mockResolvedValueOnce(finishAction) // from editList

			expect(await def.updateFromUserInput(['item1', 'item2', 'item3']))
				.toStrictEqual(['item1', 'item3'])

			expect(selectMock).toHaveBeenCalledTimes(3)
			expect(itemUpdateFromUserInputMock).not.toHaveBeenCalled()
		})

		it('returns cancelAction when canceled', async () => {
			selectMock.mockResolvedValueOnce(cancelAction)

			expect(await def.updateFromUserInput(['item1', 'item2'])).toBe(cancelAction)

			expect(selectMock).toHaveBeenCalledTimes(1)
			expect(itemUpdateFromUserInputMock).not.toHaveBeenCalled()
		})
	})
})

describe('checkboxDef', () => {
	const simpleDef = checkboxDef<string>('Checkbox Def', ['Item 1', 'Item 2', 'Item 3'])
	const simpleResults = ['Item 1', 'Item 2']
	const complexValues = [
		{ id: 'item1', name: 'Item 1', color: 'red' },
		{ id: 'item2', name: 'Item 2', color: 'orange' },
		{ id: 'item3', name: 'Item 3', color: 'yellow' },
	]
	const complexChoices = complexValues.map(value => ({ name: value.name, value }))
	const complexDef = checkboxDef('Complex Checkbox Def', complexChoices)
	const complexResults = [complexValues[0], complexValues[3]]

	it('uses given name', () => {
		expect(simpleDef.name).toBe('Checkbox Def')
	})

	describe('buildFromUserInput', () => {
		it('accepts simple string values as choices', async () => {
			checkboxMock.mockResolvedValueOnce(simpleResults)

			expect(await simpleDef.buildFromUserInput()).toBe(simpleResults)

			expect(checkboxMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
				message: 'Select Checkbox Def.',
				choices: [
					{ name: 'Item 1', value: 'Item 1' },
					{ name: 'Item 2', value: 'Item 2' },
					{ name: 'Item 3', value: 'Item 3' },
				],
				default: finishAction,
			}))
		})

		it('accepts complex values as values in choices', async () => {
			checkboxMock.mockResolvedValueOnce(complexResults)

			expect(await complexDef.buildFromUserInput()).toBe(complexResults)

			expect(checkboxMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
				choices: complexChoices,
				default: finishAction,
			}))
		})

		it('uses default values for simple string input', async () => {
			const def = checkboxDef<string>(
				'Checkbox Def',
				['Item 1', 'Item 2', 'Item 3'],
				{ default: ['Item 2', 'Item 3'] },
			)

			checkboxMock.mockResolvedValueOnce(simpleResults)

			expect(await def.buildFromUserInput()).toBe(simpleResults)

			expect(checkboxMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
				choices: [
					{ name: 'Item 1', value: 'Item 1' },
					{ name: 'Item 2', value: 'Item 2', checked: true },
					{ name: 'Item 3', value: 'Item 3', checked: true },
				],
				default: finishAction,
			}))
		})

		it('uses default values for complex input', async () => {
			const def = checkboxDef(
				'Complex Checkbox Def',
				complexChoices,
				{ default: [complexValues[0]] },
			)

			checkboxMock.mockResolvedValueOnce(complexResults)

			expect(await def.buildFromUserInput()).toBe(complexResults)

			expect(checkboxMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
				choices: [
					{ ...complexChoices[0], checked: true },
					complexChoices[1],
					complexChoices[2],
				],
				default: finishAction,
			}))
		})

		it('uses supplied validate method', async () => {
			const validate = jest.fn<Required<CheckboxDefOptions<string>>['validate']>()
			const def = checkboxDef('Checkbox Def', ['Item 1', 'Item 2', 'Item 3'], { validate })
			checkboxMock.mockResolvedValueOnce(simpleResults)

			expect(await def.buildFromUserInput()).toBe(simpleResults)

			expect(checkboxMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
				validate,
			}))
		})

		it('includes help option when helpText is supplied', async () => {
			const def = checkboxDef<string>(
				'Checkbox Def',
				['Item 1', 'Item 2'],
				{ helpText: 'help text' },
			)
			checkboxMock.mockResolvedValueOnce(['Item 1'])

			expect(await def.buildFromUserInput()).toStrictEqual(['Item 1'])

			expect(checkboxMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
				message: 'Select Checkbox Def.',
				choices: [
					{ name: 'Item 1', value: 'Item 1' },
					{ name: 'Item 2', value: 'Item 2' },
				],
				default: finishAction,
			}))

			expect(consoleLogSpy).toHaveBeenCalledWith('\nhelp text\n')
		})
	})

	describe('summarizeForEdit', () => {
		it('returns empty clipped string with no items', async () => {
			expect(simpleDef.summarizeForEdit([])).toBe('clipped')

			expect(clipToMaximumMock).toHaveBeenCalledExactlyOnceWith('', maxItemValueLength)
		})

		it('default summarizeForEdit uses item stringFromUnknown', async () => {
			stringFromUnknownMock.mockReturnValueOnce('Item 1')
			stringFromUnknownMock.mockReturnValueOnce('Item 2')

			expect(simpleDef.summarizeForEdit(['item1', 'item2'])).toBe('clipped')

			expect(stringFromUnknownMock).toHaveBeenCalledTimes(2)
			expect(stringFromUnknownMock).toHaveBeenCalledWith('item1')
			expect(stringFromUnknownMock).toHaveBeenCalledWith('item2')
			expect(clipToMaximumMock)
				.toHaveBeenCalledExactlyOnceWith('Item 1, Item 2', maxItemValueLength)
		})

		it('uses given summarizeForEdit', async () => {
			const summarizeForEdit =
				jest.fn<Required<CheckboxDefOptions<string>>['summarizeForEdit']>()
			const def = checkboxDef(
				'Checkbox Def',
				['Item 1', 'Item 2', 'Item 3'],
				{ summarizeForEdit },
			)

			expect(def.summarizeForEdit).toBe(summarizeForEdit)
		})
	})

	describe('updateFromUserInput', () => {
		// Shares code from buildFromUserInput so most of this is tested there.

		it('preselects previous values', async () => {
			const def = checkboxDef('Complex Checkbox Def', complexChoices)

			checkboxMock.mockResolvedValueOnce(complexResults)

			expect(await def.updateFromUserInput([complexValues[1]])).toBe(complexResults)

			expect(checkboxMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
				choices: [
					complexChoices[0],
					{ ...complexChoices[1], checked: true },
					complexChoices[2],
				],
				default: finishAction,
			}))
		})
	})
})
