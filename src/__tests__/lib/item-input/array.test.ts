import { jest } from '@jest/globals'

import inquirer from 'inquirer'

import {
	addAction,
	cancelAction,
	cancelOption,
	deleteAction,
	editAction,
	finishAction,
	helpAction,
	helpOption,
	InputDefinition,
	maxItemValueLength,
	uneditable,
} from '../../../lib/item-input/defs.js'
import { clipToMaximum, stringFromUnknown } from '../../../lib/util.js'


const promptMock: jest.Mock<typeof inquirer.prompt> = jest.fn()
jest.unstable_mockModule('inquirer', () => ({
	default: {
		prompt: promptMock,
		Separator: inquirer.Separator,
	},
}))
const clipToMaximumMock: jest.Mock<typeof clipToMaximum> = jest.fn()
clipToMaximumMock.mockReturnValue('clipped')
const stringFromUnknownMock: jest.Mock<typeof stringFromUnknown> = jest.fn()
jest.unstable_mockModule('../../../lib/util.js', () => ({
	clipToMaximum: clipToMaximumMock,
	stringFromUnknown: stringFromUnknownMock,
}))

// ignore console output
jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => true)


const { arrayDef, checkboxDef } = await import('../../../lib/item-input/array.js')


describe('arrayDef', () => {
	const itemBuildFromUserInputMock = jest.fn()
	const itemSummarizeForEditMock = jest.fn().mockImplementation(item => `summarized ${item}`)
	const itemUpdateFromUserInputMock = jest.fn()
	const itemDefMock: InputDefinition<string> = {
		name: 'Item Def',
		buildFromUserInput: itemBuildFromUserInputMock,
		summarizeForEdit: itemSummarizeForEditMock,
		updateFromUserInput: itemUpdateFromUserInputMock,
	}

	const def = arrayDef('Array Def', itemDefMock)

	it('uses the given name', () => {
		expect(def.name).toBe('Array Def')
	})

	describe('buildFromUserInput', () => {
		it('does not allow uneditable items', async () => {
			promptMock.mockResolvedValueOnce({ action: addAction })
			itemBuildFromUserInputMock.mockResolvedValueOnce('entered value')
			itemSummarizeForEditMock.mockReturnValueOnce(uneditable)

			await expect(def.buildFromUserInput()).rejects.toThrow('The itemDef used for an arrayDef must be editable.')

			expect(itemBuildFromUserInputMock).toHaveBeenCalledTimes(1)
			expect(itemSummarizeForEditMock).toHaveBeenCalledTimes(1)
		})

		it('requires at least one item by default', async () => {
			promptMock.mockResolvedValueOnce({ action: addAction })
			promptMock.mockResolvedValueOnce({ action: finishAction })
			itemBuildFromUserInputMock.mockResolvedValueOnce('item1')

			expect(await def.buildFromUserInput()).toStrictEqual(['item1'])

			expect(promptMock).toHaveBeenCalledTimes(2)
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
				message: 'Add or edit Array Def.',
				default: addAction,
				choices: [
					{ name: 'Add Item Def.', value: addAction },
					cancelOption,
				],
			}))
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: expect.arrayContaining([
					{ name: 'Add Item Def.', value: addAction },
					cancelOption,
					{ name: 'Finish editing Array Def.', value: finishAction },
				]),
				default: finishAction,
			}))

			expect(itemBuildFromUserInputMock).toHaveBeenCalledTimes(1)
			expect(itemBuildFromUserInputMock).toHaveBeenCalledWith([[]])
		})

		it('does not allow duplicates by default', async () => {
			promptMock.mockResolvedValueOnce({ action: addAction })
			itemBuildFromUserInputMock.mockResolvedValueOnce('item1')
			promptMock.mockResolvedValueOnce({ action: addAction })
			itemBuildFromUserInputMock.mockResolvedValueOnce('item1')
			promptMock.mockResolvedValueOnce({ action: finishAction })

			expect(await def.buildFromUserInput()).toStrictEqual(['item1'])

			expect(promptMock).toHaveBeenCalledTimes(3)
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
				message: 'Add or edit Array Def.',
				default: addAction,
				choices: [
					{ name: 'Add Item Def.', value: addAction },
					cancelOption,
				],
			}))
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: expect.arrayContaining([
					{ name: 'Add Item Def.', value: addAction },
					cancelOption,
					{ name: 'Finish editing Array Def.', value: finishAction },
				]),
				default: finishAction,
			}))
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
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

			promptMock.mockResolvedValueOnce({ action: addAction })
			itemBuildFromUserInputMock.mockResolvedValueOnce('item1')
			promptMock.mockResolvedValueOnce({ action: addAction })
			itemBuildFromUserInputMock.mockResolvedValueOnce('item1')
			promptMock.mockResolvedValueOnce({ action: finishAction })

			expect(await def.buildFromUserInput()).toStrictEqual(['item1', 'item1'])

			expect(promptMock).toHaveBeenCalledTimes(3)
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
				message: 'Add or edit Array Def.',
				default: addAction,
				choices: [
					{ name: 'Add Item Def.', value: addAction },
					cancelOption,
				],
			}))
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: expect.arrayContaining([
					{ name: 'Add Item Def.', value: addAction },
					cancelOption,
					{ name: 'Finish editing Array Def.', value: finishAction },
				]),
				default: finishAction,
			}))
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
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
				promptMock.mockResolvedValueOnce({ action: addAction })
				itemBuildFromUserInputMock.mockResolvedValueOnce(`item${index}`)
			}
			promptMock.mockResolvedValueOnce({ action: finishAction })

			const result = await def.buildFromUserInput() as string[]
			expect(result.length).toBe(1000)

			expect(promptMock).toHaveBeenCalledTimes(1001)
			expect(itemBuildFromUserInputMock).toHaveBeenCalledTimes(1000)
		})

		it('allows empty array when asked to do so', async () => {
			const def = arrayDef('Array Def', itemDefMock, { minItems: 0 })

			promptMock.mockResolvedValueOnce({ action: finishAction })

			expect(await def.buildFromUserInput()).toStrictEqual([])

			expect(promptMock).toHaveBeenCalledTimes(1)
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
				message: 'Add or edit Array Def.',
				default: finishAction,
				choices: [
					{ name: 'Add Item Def.', value: addAction },
					{ name: 'Finish editing Array Def.', value: finishAction },
					cancelOption,
				],
			}))

			expect(itemBuildFromUserInputMock).toHaveBeenCalledTimes(0)
		})

		it('requires specified minium', async () => {
			const def = arrayDef('Array Def', itemDefMock, { minItems: 2 })

			promptMock.mockResolvedValueOnce({ action: addAction })
			promptMock.mockResolvedValueOnce({ action: addAction })
			promptMock.mockResolvedValueOnce({ action: finishAction })
			itemBuildFromUserInputMock.mockResolvedValueOnce('item1')
			itemBuildFromUserInputMock.mockResolvedValueOnce('item2')

			expect(await def.buildFromUserInput()).toStrictEqual(['item1', 'item2'])

			expect(promptMock).toHaveBeenCalledTimes(3)
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
				default: addAction,
				choices: [
					{ name: 'Add Item Def.', value: addAction },
					cancelOption,
				],
			}))
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: [
					{ name: 'Edit summarized item1.', value: 0 },
					expect.any(inquirer.Separator),
					{ name: 'Add Item Def.', value: addAction },
					cancelOption,
				],
				default: addAction,
			}))
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: [
					{ name: 'Edit summarized item1.', value: 0 },
					{ name: 'Edit summarized item2.', value: 1 },
					expect.any(inquirer.Separator),
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

			promptMock.mockResolvedValueOnce({ action: addAction })
			itemBuildFromUserInputMock.mockResolvedValueOnce('item1')
			promptMock.mockResolvedValueOnce({ action: addAction })
			itemBuildFromUserInputMock.mockResolvedValueOnce('item2')
			promptMock.mockResolvedValueOnce({ action: addAction })
			itemBuildFromUserInputMock.mockResolvedValueOnce('item3')
			promptMock.mockResolvedValueOnce({ action: finishAction })

			expect(await def.buildFromUserInput()).toStrictEqual(['item1', 'item2', 'item3'])

			expect(promptMock).toHaveBeenCalledTimes(4)
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: [
					{ name: 'Add Item Def.', value: addAction },
					cancelOption,
				],
				default: addAction,
			}))
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: [
					{ name: 'Edit summarized item1.', value: 0 },
					expect.any(inquirer.Separator),
					{ name: 'Add Item Def.', value: addAction },
					{ name: 'Finish editing Array Def.', value: finishAction },
					cancelOption,
				],
				default: finishAction,
			}))
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: [
					{ name: 'Edit summarized item1.', value: 0 },
					{ name: 'Edit summarized item2.', value: 1 },
					expect.any(inquirer.Separator),
					{ name: 'Add Item Def.', value: addAction },
					{ name: 'Finish editing Array Def.', value: finishAction },
					cancelOption,
				],
				default: finishAction,
			}))
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: [
					{ name: 'Edit summarized item1.', value: 0 },
					{ name: 'Edit summarized item2.', value: 1 },
					{ name: 'Edit summarized item3.', value: 2 },
					expect.any(inquirer.Separator),
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
			promptMock.mockResolvedValueOnce({ action: cancelAction })

			expect(await def.buildFromUserInput()).toBe(cancelAction)

			expect(promptMock).toHaveBeenCalledTimes(1)
			expect(itemBuildFromUserInputMock).toHaveBeenCalledTimes(0)
		})

		it('throws error on invalid action', async () => {
			// This is a "should-never-happen" error that we can artificially create with mocking.
			promptMock.mockResolvedValueOnce({ action: 'bad action' })

			await expect(def.buildFromUserInput()).rejects.toThrow('unexpected state in arrayDef; action = "bad action"')

			expect(promptMock).toHaveBeenCalledTimes(1)
			expect(itemBuildFromUserInputMock).toHaveBeenCalledTimes(0)
		})

		it('includes help option when helpText is supplied', async () => {
			promptMock.mockResolvedValueOnce({ action: helpAction })
			promptMock.mockResolvedValueOnce({ action: cancelAction })

			const def = arrayDef('Array Def', itemDefMock, { helpText: 'help text' })

			expect(await def.buildFromUserInput()).toBe(cancelAction)

			expect(promptMock).toHaveBeenCalledTimes(2)
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
				message: 'Add or edit Array Def.',
				default: addAction,
				choices: [
					helpOption,
					{ name: 'Add Item Def.', value: addAction },
					cancelOption,
				],
			}))

			expect(consoleLogSpy).toHaveBeenCalledTimes(1)
			expect(consoleLogSpy).toHaveBeenCalledWith('\nhelp text\n')
		})

		// This test tests a situation that should be impossible to get into but allows for 100% coverage. :-)
		// (Typescript can't tell that `helpText` is defined for sure but we know it is because we
		// don't even include an option for displaying help if it isn't.)
		it('logs undefined for help text in unexpected circumstance', async () => {
			// Here is where we mock something that can't happen since `helpAction` isn't included
			// when no help text is supplied.
			promptMock.mockResolvedValueOnce({ action: helpAction })
			promptMock.mockResolvedValueOnce({ action: cancelAction })

			const def = arrayDef('Array Def', itemDefMock)

			expect(await def.buildFromUserInput()).toBe(cancelAction)

			expect(promptMock).toHaveBeenCalledTimes(2)

			expect(consoleLogSpy).toHaveBeenCalledTimes(1)
			expect(consoleLogSpy).toHaveBeenCalledWith('\nundefined\n')
		})
	})

	describe('summarizeForEdit', () => {
		it('returns empty clipped string with no items', async () => {
			expect(def.summarizeForEdit([])).toBe('clipped')

			expect(clipToMaximumMock).toHaveBeenCalledTimes(1)
			expect(clipToMaximumMock).toHaveBeenCalledWith('', maxItemValueLength)
		})

		it('default summarizeForEdit uses item summarizeForEdit', async () => {
			itemSummarizeForEditMock.mockReturnValueOnce('Item 1')
			itemSummarizeForEditMock.mockReturnValueOnce('Item 2')

			expect(def.summarizeForEdit(['item1', 'item2'])).toBe('clipped')

			expect(itemSummarizeForEditMock).toHaveBeenCalledTimes(2)
			expect(itemSummarizeForEditMock).toHaveBeenCalledWith('item1')
			expect(itemSummarizeForEditMock).toHaveBeenCalledWith('item2')
			expect(clipToMaximumMock).toHaveBeenCalledTimes(1)
			expect(clipToMaximumMock).toHaveBeenCalledWith('Item 1, Item 2', maxItemValueLength)
		})

		it('uses given summarizeForEdit', async () => {
			const summarizeForEdit = jest.fn()
			const def = arrayDef('Array Def', itemDefMock, { summarizeForEdit })

			expect(def.summarizeForEdit).toBe(summarizeForEdit)
		})
	})

	describe('updateFromUserInput', () => {
		// Shares code from buildFromUserInput so much of this is tested there.

		it('doesn\'t allow removal of last item by default', async () => {
			promptMock.mockResolvedValueOnce({ action: 0 }) // from editList
			promptMock.mockResolvedValueOnce({ action: cancelAction }) // from editItem
			promptMock.mockResolvedValueOnce({ action: finishAction }) // from editList

			expect(await def.updateFromUserInput(['item1'])).toStrictEqual(['item1'])

			expect(promptMock).toHaveBeenCalledTimes(3)
			// The prompt in editItem should have no delete option.
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: [
					{ name: 'Edit summarized item1.', value: editAction },
					cancelOption,
				],
				default: editAction,
			}))
			expect(itemUpdateFromUserInputMock).toHaveBeenCalledTimes(0)
		})

		it('allows editing of an item', async () => {
			promptMock.mockResolvedValueOnce({ action: 1 }) // from editList
			promptMock.mockResolvedValueOnce({ action: editAction }) // from editItem
			itemUpdateFromUserInputMock.mockResolvedValueOnce('updated item2')
			promptMock.mockResolvedValueOnce({ action: finishAction }) // from editList

			expect(await def.updateFromUserInput(['item1', 'item2', 'item3'])).toStrictEqual(['item1', 'updated item2', 'item3'])

			expect(promptMock).toHaveBeenCalledTimes(3)
			expect(itemUpdateFromUserInputMock).toHaveBeenCalledTimes(1)
		})

		it('does not allow duplicates by default', async () => {
			promptMock.mockResolvedValueOnce({ action: 1 }) // from editList
			promptMock.mockResolvedValueOnce({ action: editAction }) // from editItem
			itemUpdateFromUserInputMock.mockResolvedValueOnce('item3') // `item3` is already used!
			promptMock.mockResolvedValueOnce({ action: finishAction }) // from editList

			expect(await def.updateFromUserInput(['item1', 'item2', 'item3'])).toStrictEqual(['item1', 'item2', 'item3'])

			expect(promptMock).toHaveBeenCalledTimes(3)
			expect(consoleLogSpy).toHaveBeenCalledTimes(1)
			expect(consoleLogSpy).toHaveBeenCalledWith('Duplicate values are not allowed.')
			expect(itemUpdateFromUserInputMock).toHaveBeenCalledTimes(1)
			expect(itemUpdateFromUserInputMock).toHaveBeenCalledWith('item2', [])
		})

		it('always allow reentering current value even when duplicates are not allowed', async () => {
			promptMock.mockResolvedValueOnce({ action: 1 }) // from editList
			promptMock.mockResolvedValueOnce({ action: editAction }) // from editItem
			itemUpdateFromUserInputMock.mockResolvedValueOnce('item2') // not changing the value
			promptMock.mockResolvedValueOnce({ action: finishAction }) // from editList

			expect(await def.updateFromUserInput(['item1', 'item2', 'item3'])).toStrictEqual(['item1', 'item2', 'item3'])

			expect(promptMock).toHaveBeenCalledTimes(3)
			expect(consoleLogSpy).toHaveBeenCalledTimes(0)
			expect(itemUpdateFromUserInputMock).toHaveBeenCalledTimes(1)
			expect(itemUpdateFromUserInputMock).toHaveBeenCalledWith('item2', [])
		})

		it('allows duplicates if specified', async () => {
			const def = arrayDef('Array Def', itemDefMock, { allowDuplicates: true })

			promptMock.mockResolvedValueOnce({ action: 1 }) // from editList
			promptMock.mockResolvedValueOnce({ action: editAction }) // from editItem
			itemUpdateFromUserInputMock.mockResolvedValueOnce('item3') // `item3` is already used!
			promptMock.mockResolvedValueOnce({ action: finishAction }) // from editList

			expect(await def.updateFromUserInput(['item1', 'item2', 'item3'])).toStrictEqual(['item1', 'item3', 'item3'])

			expect(promptMock).toHaveBeenCalledTimes(3)
			expect(consoleLogSpy).toHaveBeenCalledTimes(0)
			expect(itemUpdateFromUserInputMock).toHaveBeenCalledTimes(1)
			expect(itemUpdateFromUserInputMock).toHaveBeenCalledWith('item2', [])
		})

		it('supports item removal', async () => {
			promptMock.mockResolvedValueOnce({ action: 1 }) // from editList
			promptMock.mockResolvedValueOnce({ action: deleteAction }) // from editItem
			promptMock.mockResolvedValueOnce({ action: finishAction }) // from editList

			expect(await def.updateFromUserInput(['item1', 'item2', 'item3'])).toStrictEqual(['item1', 'item3'])

			expect(promptMock).toHaveBeenCalledTimes(3)
			expect(itemUpdateFromUserInputMock).toHaveBeenCalledTimes(0)
		})

		it('returns cancelAction when canceled', async () => {
			promptMock.mockResolvedValueOnce({ action: cancelAction })

			expect(await def.updateFromUserInput(['item1', 'item2'])).toBe(cancelAction)

			expect(promptMock).toHaveBeenCalledTimes(1)
			expect(itemUpdateFromUserInputMock).toHaveBeenCalledTimes(0)
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
		it('uses simple string values as choices', async () => {
			promptMock.mockResolvedValueOnce({ values: simpleResults })

			expect(await simpleDef.buildFromUserInput()).toBe(simpleResults)

			expect(promptMock).toHaveBeenCalledTimes(1)
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
				type: 'checkbox',
				name: 'values',
				message: 'Select Checkbox Def.',
				choices: ['Item 1', 'Item 2', 'Item 3'],
				default: finishAction,
				validate: undefined,
			}))
		})

		it('uses complex values as values in choices', async () => {
			promptMock.mockResolvedValueOnce({ values: complexResults })

			expect(await complexDef.buildFromUserInput()).toBe(complexResults)

			expect(promptMock).toHaveBeenCalledTimes(1)
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: complexChoices,
				default: finishAction,
			}))
		})

		it('uses default values for simple string input', async () => {
			const def = checkboxDef<string>('Checkbox Def', ['Item 1', 'Item 2', 'Item 3'], { default: ['Item 2', 'Item 3'] })

			promptMock.mockResolvedValueOnce({ values: simpleResults })

			expect(await def.buildFromUserInput()).toBe(simpleResults)

			expect(promptMock).toHaveBeenCalledTimes(1)
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: [
					'Item 1',
					{ name: 'Item 2', value: 'Item 2', checked: true },
					{ name: 'Item 3', value: 'Item 3', checked: true },
				],
				default: finishAction,
			}))
		})

		it('uses default values for complex input', async () => {
			const def = checkboxDef('Complex Checkbox Def', complexChoices, { default: [complexValues[0]] })

			promptMock.mockResolvedValueOnce({ values: complexResults })

			expect(await def.buildFromUserInput()).toBe(complexResults)

			expect(promptMock).toHaveBeenCalledTimes(1)
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: [
					{ ...complexChoices[0], checked: true },
					complexChoices[1],
					complexChoices[2],
				],
				default: finishAction,
			}))
		})

		it('uses supplied validate method', async () => {
			const validate = jest.fn()
			const def = checkboxDef<string>('Checkbox Def', ['Item 1', 'Item 2', 'Item 3'], { validate })
			promptMock.mockResolvedValueOnce({ values: simpleResults })

			expect(await def.buildFromUserInput()).toBe(simpleResults)

			expect(promptMock).toHaveBeenCalledTimes(1)
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
				validate,
			}))
		})

		it('includes help option when helpText is supplied', async () => {
			const def = checkboxDef<string>('Checkbox Def', ['Item 1', 'Item 2'], { helpText: 'help text' })
			promptMock.mockResolvedValueOnce({ values: ['Item 1'] })

			expect(await def.buildFromUserInput()).toStrictEqual(['Item 1'])

			expect(promptMock).toHaveBeenCalledTimes(1)
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
				type: 'checkbox',
				name: 'values',
				message: 'Select Checkbox Def.',
				choices: ['Item 1', 'Item 2'],
				default: finishAction,
				validate: undefined,
			}))

			expect(consoleLogSpy).toHaveBeenCalledTimes(1)
			expect(consoleLogSpy).toHaveBeenCalledWith('\nhelp text\n')
		})
	})

	describe('summarizeForEdit', () => {
		it('returns empty clipped string with no items', async () => {
			expect(simpleDef.summarizeForEdit([])).toBe('clipped')

			expect(clipToMaximumMock).toHaveBeenCalledTimes(1)
			expect(clipToMaximumMock).toHaveBeenCalledWith('', maxItemValueLength)
		})

		it('default summarizeForEdit uses item stringFromUnknown', async () => {
			stringFromUnknownMock.mockReturnValueOnce('Item 1')
			stringFromUnknownMock.mockReturnValueOnce('Item 2')

			expect(simpleDef.summarizeForEdit(['item1', 'item2'])).toBe('clipped')

			expect(stringFromUnknownMock).toHaveBeenCalledTimes(2)
			expect(stringFromUnknownMock).toHaveBeenCalledWith('item1')
			expect(stringFromUnknownMock).toHaveBeenCalledWith('item2')
			expect(clipToMaximumMock).toHaveBeenCalledTimes(1)
			expect(clipToMaximumMock).toHaveBeenCalledWith('Item 1, Item 2', maxItemValueLength)
		})

		it('uses given summarizeForEdit', async () => {
			const summarizeForEdit = jest.fn()
			const def = checkboxDef<string>('Checkbox Def', ['Item 1', 'Item 2', 'Item 3'], { summarizeForEdit })

			expect(def.summarizeForEdit).toBe(summarizeForEdit)
		})
	})

	describe('updateFromUserInput', () => {
		// Shares code from buildFromUserInput so most of this is tested there.

		it('preselects previous values', async () => {
			const def = checkboxDef('Complex Checkbox Def', complexChoices)

			promptMock.mockResolvedValueOnce({ values: complexResults })

			expect(await def.updateFromUserInput([complexValues[1]])).toBe(complexResults)

			expect(promptMock).toHaveBeenCalledTimes(1)
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
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
