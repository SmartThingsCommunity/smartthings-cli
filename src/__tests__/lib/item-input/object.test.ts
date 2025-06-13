import { jest } from '@jest/globals'

import { type select, Separator } from '@inquirer/prompts'

import {
	cancelAction,
	finishAction,
	helpAction,
	type InputDefinition,
	inquirerPageSize,
} from '../../../lib/item-input/defs.js'
import type { ObjectDefOptions, ObjectItemTypeData } from '../../../lib/item-input/object.js'
import { buildInputDefMock } from '../../test-lib/input-type-mock.js'


const selectMock = jest.fn<typeof select>()
jest.unstable_mockModule('@inquirer/prompts', () => ({
	select: selectMock,
	Separator,
}))


const { objectDef } = await import('../../../lib/item-input/object.js')


type InputtedThing = {
	prop1: string
	prop2: string
	prop3?: string
	prop4: string
}
describe('objectDef', () => {
	const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /*no-op*/ })

	const input1DefMock = buildInputDefMock<string>('Item Name 1')
	const {
		buildFromUserInput: input1BuildFromUserInputMock,
		summarizeForEdit: input1SummarizeForEditMock,
		updateFromUserInput: input1UpdateFromUserInputMock,
	} = input1DefMock.mocks

	const input2DefMock = buildInputDefMock<string>('Item Name 2')
	const {
		buildFromUserInput: input2BuildFromUserInputMock,
		summarizeForEdit: input2SummarizeForEditMock,
		updateFromUserInput: input2UpdateFromUserInputMock,
	} = input2DefMock.mocks

	const input3DefMock = buildInputDefMock<string>('Item Name 3')
	const {
		buildFromUserInput: input3BuildFromUserInputMock,
		summarizeForEdit: input3SummarizeForEditMock,
		updateFromUserInput: input3UpdateFromUserInputMock,
	} = input3DefMock.mocks

	const threeInputDef = objectDef('Object Def', {
		input1: input1DefMock,
		input2: input2DefMock,
		input3: input3DefMock,
	})
	const updateIfNeededMock = jest.fn<Required<InputDefinition<string>>['updateIfNeeded']>()
		.mockImplementation(async original => original)
	const input3DefWithUpdateIfNeededMock: InputDefinition<string> = {
		...input3DefMock,
		updateIfNeeded: updateIfNeededMock,
	}

	const input4DefMock = buildInputDefMock<string>('Item Name 4')
	const {
		buildFromUserInput: input4BuildFromUserInputMock,
		summarizeForEdit: input4SummarizeForEditMock,
	} = input4DefMock.mocks

	const simpleInputDefsByProperty = {
		name: input1DefMock,
	}
	const simpleDef = objectDef('Object Def', simpleInputDefsByProperty)

	it('uses the given name', () => {
		expect(simpleDef.name).toBe('Object Def')
	})

	describe('itemTypeData', () => {
		it('includes type of "object" and keeps inputDefsByProperty', () => {
			expect(simpleDef.itemTypeData).toStrictEqual(expect.objectContaining({
				inputDefsByProperty: simpleInputDefsByProperty,
				type: 'object',
			}))
		})

		it('defaults rolledUp to true with 3 or fewer properties', () => {
			const def = objectDef('Object Def', {
				prop1: input1DefMock,
				prop2: input2DefMock,
				prop4: input4DefMock,
			})

			const itemTypeData = def.itemTypeData as ObjectItemTypeData<unknown>
			expect(itemTypeData.rolledUp).toBe(true)
		})

		it('does not include undefined properties in count for rolledUp', () => {
			const def = objectDef<InputtedThing>('Object Def', {
				prop1: input1DefMock,
				prop2: input2DefMock,
				prop3: undefined,
				prop4: input4DefMock,
			})

			const itemTypeData = def.itemTypeData as ObjectItemTypeData<unknown>
			expect(itemTypeData.rolledUp).toBe(true)
		})

		it('defaults rolledUp to false with 4 or more properties', () => {
			const def = objectDef('Object Def', {
				prop1: input1DefMock,
				prop2: input2DefMock,
				prop3: input3DefMock,
				prop4: input4DefMock,
			})

			const itemTypeData = def.itemTypeData as ObjectItemTypeData<unknown>
			expect(itemTypeData.rolledUp).toBe(false)
		})
	})

	describe('buildFromUserInput', () => {
		it('calls buildFromUserInput for each child property', async () => {
			input1BuildFromUserInputMock.mockResolvedValueOnce('Item Value 1')
			input2BuildFromUserInputMock.mockResolvedValueOnce('Item Value 2')
			input3BuildFromUserInputMock.mockResolvedValueOnce('Item Value 3')

			expect(await threeInputDef.buildFromUserInput())
				.toEqual({ input1: 'Item Value 1', input2: 'Item Value 2', 'input3': 'Item Value 3' })

			expect(input1BuildFromUserInputMock).toHaveBeenCalledTimes(1)
			expect(input1BuildFromUserInputMock).toHaveBeenCalledWith([{}])
			expect(input2BuildFromUserInputMock).toHaveBeenCalledTimes(1)
			expect(input2BuildFromUserInputMock).toHaveBeenCalledWith([{ input1: 'Item Value 1' }])
			expect(input3BuildFromUserInputMock).toHaveBeenCalledTimes(1)
			expect(input3BuildFromUserInputMock).toHaveBeenCalledWith([{ input1: 'Item Value 1', input2: 'Item Value 2' }])
		})

		it('stops when input canceled', async () => {
			input1BuildFromUserInputMock.mockResolvedValueOnce('Input 1')
			input2BuildFromUserInputMock.mockResolvedValueOnce(cancelAction)

			expect(await threeInputDef.buildFromUserInput()).toEqual(cancelAction)

			expect(input1BuildFromUserInputMock).toHaveBeenCalledTimes(1)
			expect(input2BuildFromUserInputMock).toHaveBeenCalledTimes(1)
			expect(input3BuildFromUserInputMock).toHaveBeenCalledTimes(0)
		})

		it('skips inputDefsByProperty keys with `undefined` value', async () => {
			const def = objectDef<InputtedThing>('Object Def', {
				prop1: input1DefMock,
				prop2: input2DefMock,
				prop3: undefined,
				prop4: input4DefMock,
			})

			input1BuildFromUserInputMock.mockResolvedValueOnce('Input Value 1')
			input2BuildFromUserInputMock.mockResolvedValueOnce('Input Value 2')
			input4BuildFromUserInputMock.mockResolvedValueOnce('Input Value 4')

			expect(await def.buildFromUserInput()).toStrictEqual({
				prop1: 'Input Value 1',
				prop2: 'Input Value 2',
				prop4: 'Input Value 4',
			})
		})

		it('displays help text before prompting for inputs', async () => {
			input1BuildFromUserInputMock.mockResolvedValueOnce('Entered Name')

			const def = objectDef('Object Def', simpleInputDefsByProperty, { helpText: 'help text' })

			expect(await def.buildFromUserInput()).toEqual({ name: 'Entered Name' })

			expect(consoleLogSpy).toHaveBeenCalledTimes(1)
			expect(consoleLogSpy).toHaveBeenCalledWith('\nhelp text\n')

			expect(input1BuildFromUserInputMock).toHaveBeenCalledTimes(1)
			expect(input1BuildFromUserInputMock).toHaveBeenCalledWith([{}])
		})
	})

	describe('summarizeForEdit', () => {
		it('throws error by default', () => {
			expect(() => simpleDef.summarizeForEdit({ name: 'unused' }))
				.toThrow('missing implementation of summarizeForEdit for objectDef Object Def')
		})

		it('uses function specified as option', () => {
			const summarizeForEdit = jest.fn<Required<ObjectDefOptions<object>>['summarizeForEdit']>()

			const def = objectDef('Object Def', simpleInputDefsByProperty, { summarizeForEdit })

			expect(def.summarizeForEdit).toBe(summarizeForEdit)
		})
	})

	describe('updateFromUserInput', () => {
		it('edits top-level items with updateFromUserInput from item', async () => {
			input1SummarizeForEditMock.mockReturnValue('Summarized Input 1')
			input2SummarizeForEditMock.mockReturnValue('Summarized Input 2')
			input3SummarizeForEditMock.mockReturnValue('Summarized Input 3')
			selectMock.mockResolvedValueOnce('input2')
			input2UpdateFromUserInputMock.mockResolvedValueOnce('Updated Input 2')
			selectMock.mockResolvedValueOnce(finishAction)

			const original = { input1: 'Item Value 1', input2: 'Item Value 2', 'input3': 'Item Value 3' }
			expect(await threeInputDef.updateFromUserInput(original))
				.toStrictEqual({ input1: 'Item Value 1', input2: 'Updated Input 2', 'input3': 'Item Value 3' })

			expect(selectMock).toHaveBeenCalledTimes(2)
			expect(selectMock).toHaveBeenCalledWith({
				message: 'Object Def',
				choices: [
					{ name: 'Edit Item Name 1: Summarized Input 1', value: 'input1' },
					{ name: 'Edit Item Name 2: Summarized Input 2', value: 'input2' },
					{ name: 'Edit Item Name 3: Summarized Input 3', value: 'input3' },
					expect.any(Separator),
					{ name: 'Finish editing Object Def.', value: finishAction },
					{ name: 'Cancel', value: cancelAction },
				],
				default: finishAction,
				pageSize: inquirerPageSize,
			})
			expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: expect.arrayContaining([
					{ name: 'Edit Item Name 1: Summarized Input 1', value: 'input1' },
					{ name: 'Edit Item Name 2: Summarized Input 2', value: 'input2' },
					{ name: 'Edit Item Name 3: Summarized Input 3', value: 'input3' },
				]),
			}))

			expect(input1UpdateFromUserInputMock).toHaveBeenCalledTimes(0)
			expect(input2UpdateFromUserInputMock).toHaveBeenCalledTimes(1)
			expect(input2UpdateFromUserInputMock).toHaveBeenCalledWith('Item Value 2', [original])
			expect(input3UpdateFromUserInputMock).toHaveBeenCalledTimes(0)
			expect(input1SummarizeForEditMock).toHaveBeenCalled()
			expect(input2SummarizeForEditMock).toHaveBeenCalled()
			expect(input3SummarizeForEditMock).toHaveBeenCalled()
		})

		it('skips inputDefsByProperty keys with `undefined` value', async () => {
			const def = objectDef<InputtedThing>('Object Def', {
				prop1: input1DefMock,
				prop2: input2DefMock,
				prop3: undefined,
				prop4: input4DefMock,
			})

			input1SummarizeForEditMock.mockReturnValue('Summarized Input 1')
			input2SummarizeForEditMock.mockReturnValue('Summarized Input 2')
			input4SummarizeForEditMock.mockReturnValue('Summarized Input 4')
			selectMock.mockResolvedValueOnce(finishAction)

			const original = {
				prop1: 'Input Value 1',
				prop2: 'Input Value 2',
				prop4: 'Input Value 4',
			}
			expect(await def.updateFromUserInput(original)).toStrictEqual(original)

			expect(selectMock).toHaveBeenCalledTimes(1)
			expect(selectMock).toHaveBeenCalledWith({
				message: 'Object Def',
				choices: [
					{ name: 'Edit Item Name 1: Summarized Input 1', value: 'prop1' },
					{ name: 'Edit Item Name 2: Summarized Input 2', value: 'prop2' },
					{ name: 'Edit Item Name 4: Summarized Input 4', value: 'prop4' },
					expect.any(Separator),
					{ name: 'Finish editing Object Def.', value: finishAction },
					{ name: 'Cancel', value: cancelAction },
				],
				default: finishAction,
				pageSize: inquirerPageSize,
			})
		})

		it('edits rolled-up properties at the top level', async () => {
			const def = objectDef('Object Def', {
				prop1: input1DefMock,
				objectProp: objectDef('Nested Object', {
					prop2: input2DefMock,
				}),
			})

			selectMock.mockResolvedValueOnce('objectProp.prop2')
			input2UpdateFromUserInputMock.mockResolvedValueOnce('Updated Value 2')
			selectMock.mockResolvedValueOnce(finishAction)

			input1SummarizeForEditMock.mockReturnValue('Summarized Input 1')
			input2SummarizeForEditMock.mockReturnValue('Summarized Input 2')

			expect(await def.updateFromUserInput(
				{ prop1: 'Item Value 1', objectProp: { prop2: 'Item Value 2' } },
			)).toEqual(
				{ prop1: 'Item Value 1', objectProp: { prop2: 'Updated Value 2' } },
			)

			expect(selectMock).toHaveBeenCalledTimes(2)
			expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: expect.arrayContaining([
					{ name: 'Edit Item Name 1: Summarized Input 1', value: 'prop1' },
					{ name: 'Edit Item Name 2: Summarized Input 2', value: 'objectProp.prop2' },
				]),
			}))

			expect(input1SummarizeForEditMock).toHaveBeenCalled()
			expect(input2SummarizeForEditMock).toHaveBeenCalled()
		})

		it('edits nested properties not rolled-up via nested calls', async () => {
			const def = objectDef('Object Def', {
				prop1: input1DefMock,
				objectProp: objectDef('Nested Object', {
					prop2: input2DefMock,
				}, { rollup: false, summarizeForEdit: () => 'Nested Object Summary' }),
			})

			selectMock.mockResolvedValueOnce('objectProp') // outer object
			selectMock.mockResolvedValueOnce('prop2') // nested object
			input2UpdateFromUserInputMock.mockResolvedValueOnce('Updated Value 2')
			selectMock.mockResolvedValueOnce(finishAction) // leave nested
			selectMock.mockResolvedValueOnce(finishAction) // finish outer

			input1SummarizeForEditMock.mockReturnValue('Summarized Input 1')
			input2SummarizeForEditMock.mockReturnValue('Summarized Input 2')

			expect(await def.updateFromUserInput(
				{ prop1: 'Item Value 1', objectProp: { prop2: 'Item Value 2' } },
			)).toEqual(
				{ prop1: 'Item Value 1', objectProp: { prop2: 'Updated Value 2' } },
			)

			expect(selectMock).toHaveBeenCalledTimes(4)
			expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: expect.arrayContaining([
					{ name: 'Edit Item Name 1: Summarized Input 1', value: 'prop1' },
					{ name: 'Edit Nested Object: Nested Object Summary', value: 'objectProp' },
				]),
			}))
			expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: expect.arrayContaining([
					{ name: 'Edit Item Name 2: Summarized Input 2', value: 'prop2' },
				]),
			}))
		})

		it('returns `cancelAction` when canceled', async () => {
			input1SummarizeForEditMock.mockReturnValue('Summarized Input 1')
			input2SummarizeForEditMock.mockReturnValue('Summarized Input 2')
			input3SummarizeForEditMock.mockReturnValue('Summarized Input 3')
			selectMock.mockResolvedValueOnce('input2')
			input2UpdateFromUserInputMock.mockResolvedValueOnce('Updated Input 2')
			selectMock.mockResolvedValueOnce(cancelAction)

			const original = { input1: 'Item Value 1', input2: 'Item Value 2', 'input3': 'Item Value 3' }
			expect(await threeInputDef.updateFromUserInput(original)).toStrictEqual(cancelAction)

			expect(selectMock).toHaveBeenCalledTimes(2)

			expect(input1UpdateFromUserInputMock).toHaveBeenCalledTimes(0)
			expect(input2UpdateFromUserInputMock).toHaveBeenCalledTimes(1)
			expect(input2UpdateFromUserInputMock).toHaveBeenCalledWith('Item Value 2', [original])
			expect(input3UpdateFromUserInputMock).toHaveBeenCalledTimes(0)
			expect(input1SummarizeForEditMock).toHaveBeenCalled()
			expect(input2SummarizeForEditMock).toHaveBeenCalled()
			expect(input3SummarizeForEditMock).toHaveBeenCalled()
		})

		it('includes help option when helpText is supplied', async () => {
			selectMock.mockResolvedValueOnce(helpAction)
			selectMock.mockResolvedValueOnce(finishAction)

			const def = objectDef('Object Def', simpleInputDefsByProperty, { helpText: 'help text' })

			const original = { name: 'Thing Name' }
			expect(await def.updateFromUserInput(original)).toStrictEqual({ name: 'Thing Name' })

			expect(selectMock).toHaveBeenCalledTimes(2)
			expect(consoleLogSpy).toHaveBeenCalledTimes(1)
			expect(consoleLogSpy).toHaveBeenCalledWith('\nhelp text\n')
		})

		// This test tests a situation that should be impossible to get into but allows for 100% coverage. :-)
		// (Typescript can't tell that `helpText` is defined for sure but we know it is because we
		// don't even include an option for displaying help if it isn't.)
		it('logs undefined for help text in unexpected circumstance', async () => {
			// Here is where we mock something that can't happen since `helpAction` isn't included
			// when no help text is supplied.
			selectMock.mockResolvedValueOnce(helpAction)
			selectMock.mockResolvedValueOnce(finishAction)

			const def = objectDef('Object Def', simpleInputDefsByProperty)

			const original = { name: 'Thing Name' }
			expect(await def.updateFromUserInput(original)).toStrictEqual({ name: 'Thing Name' })

			expect(selectMock).toHaveBeenCalledTimes(2)
			expect(consoleLogSpy).toHaveBeenCalledTimes(1)
			expect(consoleLogSpy).toHaveBeenCalledWith('\nundefined\n')
		})

		it('calls `updateIfNeeded` on subsequent definitions when one has been updated', async () => {
			input1SummarizeForEditMock.mockReturnValue('Summarized Input 1')
			input2SummarizeForEditMock.mockReturnValue('Summarized Input 2')
			input3SummarizeForEditMock.mockReturnValue('Summarized Input 3')
			selectMock.mockResolvedValueOnce('input2')
			input2UpdateFromUserInputMock.mockResolvedValueOnce('Updated Input 2')
			selectMock.mockResolvedValueOnce(finishAction)

			const inputDef = objectDef('Object Def', {
				input1: input1DefMock,
				input2: input2DefMock,
				input3: input3DefWithUpdateIfNeededMock,
			})

			const original = { input1: 'Item Value 1', input2: 'Item Value 2', 'input3': 'Item Value 3' }
			expect(await inputDef.updateFromUserInput(original))
				.toStrictEqual({ input1: 'Item Value 1', input2: 'Updated Input 2', 'input3': 'Item Value 3' })

			expect(selectMock).toHaveBeenCalledTimes(2)
			expect(selectMock).toHaveBeenCalledWith({
				message: 'Object Def',
				choices: [
					{ name: 'Edit Item Name 1: Summarized Input 1', value: 'input1' },
					{ name: 'Edit Item Name 2: Summarized Input 2', value: 'input2' },
					{ name: 'Edit Item Name 3: Summarized Input 3', value: 'input3' },
					expect.any(Separator),
					{ name: 'Finish editing Object Def.', value: finishAction },
					{ name: 'Cancel', value: cancelAction },
				],
				default: finishAction,
				pageSize: inquirerPageSize,
			})
			expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: expect.arrayContaining([
					{ name: 'Edit Item Name 1: Summarized Input 1', value: 'input1' },
					{ name: 'Edit Item Name 2: Summarized Input 2', value: 'input2' },
					{ name: 'Edit Item Name 3: Summarized Input 3', value: 'input3' },
				]),
			}))

			expect(input1UpdateFromUserInputMock).toHaveBeenCalledTimes(0)
			expect(input2UpdateFromUserInputMock).toHaveBeenCalledTimes(1)
			expect(input2UpdateFromUserInputMock).toHaveBeenCalledWith('Item Value 2', [original])
			expect(input3UpdateFromUserInputMock).toHaveBeenCalledTimes(0)
			expect(input1SummarizeForEditMock).toHaveBeenCalled()
			expect(input2SummarizeForEditMock).toHaveBeenCalled()
			expect(input3SummarizeForEditMock).toHaveBeenCalled()
			expect(updateIfNeededMock).toHaveBeenCalledTimes(1)
			expect(updateIfNeededMock).toHaveBeenCalledWith('Item Value 3', 'input2', [{
				input1: 'Item Value 1',
				input2: 'Updated Input 2',
				input3: 'Item Value 3',
			}])
		})

		it('calls `updateIfNeeded` on subsequent definitions after rolled-up property has been updated', async () => {
			const def = objectDef('Object Def', {
				prop1: input1DefMock,
				objectProp: objectDef('Nested Object', {
					prop2: input2DefMock,
				}),
				prop3: input3DefWithUpdateIfNeededMock,
			})

			selectMock.mockResolvedValueOnce('objectProp.prop2')
			input2UpdateFromUserInputMock.mockResolvedValueOnce('Updated Prop 2 Value')
			updateIfNeededMock.mockResolvedValueOnce('Updated 3 Value')
			selectMock.mockResolvedValueOnce(finishAction)

			input1SummarizeForEditMock.mockReturnValue('Summarized Input 1')
			input2SummarizeForEditMock.mockReturnValue('Summarized Input 2')

			expect(await def.updateFromUserInput(
				{ prop1: 'Prop 1 Value', objectProp: { prop2: 'Prop 2 Value' }, prop3: 'Prop 3 Value' },
			)).toEqual(
				{ prop1: 'Prop 1 Value', objectProp: { prop2: 'Updated Prop 2 Value' }, prop3: 'Updated 3 Value' },
			)

			expect(selectMock).toHaveBeenCalledTimes(2)
			expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: expect.arrayContaining([
					{ name: 'Edit Item Name 1: Summarized Input 1', value: 'prop1' },
					{ name: 'Edit Item Name 2: Summarized Input 2', value: 'objectProp.prop2' },
				]),
			}))

			expect(input1SummarizeForEditMock).toHaveBeenCalled()
			expect(input2SummarizeForEditMock).toHaveBeenCalled()
			expect(updateIfNeededMock).toHaveBeenCalledTimes(1)
			expect(updateIfNeededMock).toHaveBeenCalledWith('Prop 3 Value', 'objectProp.prop2', [{
				prop1: 'Prop 1 Value',
				objectProp: { prop2: 'Updated Prop 2 Value' },
				prop3: 'Prop 3 Value',
			}])
		})
	})
})
