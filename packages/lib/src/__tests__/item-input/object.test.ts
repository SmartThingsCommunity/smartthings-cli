import inquirer, { Separator } from 'inquirer'

import { cancelAction, finishAction, InputDefinition, inquirerPageSize } from '../../item-input/defs'
import { objectDef, ObjectItemTypeData } from '../../item-input/object'


jest.mock('inquirer')

type InputtedThing = {
	prop1: string
	prop2: string
	prop3?: string
	prop4: string
}
describe('objectDef', () => {
	const promptMock = jest.mocked(inquirer.prompt)

	const input1BuildFromUserInputMock = jest.fn()
	const input1SummarizeForEditMock = jest.fn()
	const input1UpdateFromUserInputMock = jest.fn()
	const input1DefMock: InputDefinition<string> = {
		name: 'Item Name 1',
		buildFromUserInput: input1BuildFromUserInputMock,
		summarizeForEdit: input1SummarizeForEditMock,
		updateFromUserInput: input1UpdateFromUserInputMock,
	}

	const input2BuildFromUserInputMock = jest.fn()
	const input2SummarizeForEditMock = jest.fn()
	const input2UpdateFromUserInputMock = jest.fn()
	const input2DefMock: InputDefinition<string> = {
		name: 'Item Name 2',
		buildFromUserInput: input2BuildFromUserInputMock,
		summarizeForEdit: input2SummarizeForEditMock,
		updateFromUserInput: input2UpdateFromUserInputMock,
	}

	const input3BuildFromUserInputMock = jest.fn()
	const input3SummarizeForEditMock = jest.fn()
	const input3UpdateFromUserInputMock = jest.fn()
	const input3DefMock: InputDefinition<string> = {
		name: 'Item Name 3',
		buildFromUserInput: input3BuildFromUserInputMock,
		summarizeForEdit: input3SummarizeForEditMock,
		updateFromUserInput: input3UpdateFromUserInputMock,
	}
	const threeInputDef = objectDef('Object Def', {
		input1: input1DefMock,
		input2: input2DefMock,
		input3: input3DefMock,
	})

	const input4BuildFromUserInputMock = jest.fn()
	const input4SummarizeForEditMock = jest.fn()
	const input4UpdateFromUserInputMock = jest.fn()
	const input4DefMock: InputDefinition<string> = {
		name: 'Item Name 4',
		buildFromUserInput: input4BuildFromUserInputMock,
		summarizeForEdit: input4SummarizeForEditMock,
		updateFromUserInput: input4UpdateFromUserInputMock,
	}

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
	})

	describe('summarizeForEdit', () => {
		it('throws error by default', () => {
			expect(() => simpleDef.summarizeForEdit({ name: 'unused' }))
				.toThrow('missing implementation of summarizeForEdit for objectDef Object Def')
		})

		it('uses function specified as option', () => {
			const summarizeForEdit = jest.fn()

			const def = objectDef('Object Def', simpleInputDefsByProperty, { summarizeForEdit })

			expect(def.summarizeForEdit).toBe(summarizeForEdit)
		})
	})

	describe('updateFromUserInput', () => {
		it('edits top-level items with updateFromUserInput from item', async () => {
			input1SummarizeForEditMock.mockReturnValue('Summarized Input 1')
			input2SummarizeForEditMock.mockReturnValue('Summarized Input 2')
			input3SummarizeForEditMock.mockReturnValue('Summarized Input 3')
			promptMock.mockResolvedValueOnce({ action: 'input2' })
			input2UpdateFromUserInputMock.mockResolvedValueOnce('Updated Input 2')
			promptMock.mockResolvedValueOnce({ action: finishAction })

			const original = { input1: 'Item Value 1', input2: 'Item Value 2', 'input3': 'Item Value 3' }
			expect(await threeInputDef.updateFromUserInput(original))
				.toStrictEqual({ input1: 'Item Value 1', input2: 'Updated Input 2', 'input3': 'Item Value 3' })

			expect(promptMock).toHaveBeenCalledTimes(2)
			expect(promptMock).toHaveBeenCalledWith({
				type: 'list',
				name: 'action',
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
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
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
			promptMock.mockResolvedValueOnce({ action: finishAction })

			const original = {
				prop1: 'Input Value 1',
				prop2: 'Input Value 2',
				prop4: 'Input Value 4',
			}
			expect(await def.updateFromUserInput(original)).toStrictEqual(original)

			expect(promptMock).toHaveBeenCalledTimes(1)
			expect(promptMock).toHaveBeenCalledWith({
				type: 'list',
				name: 'action',
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

			promptMock.mockResolvedValueOnce({ action: 'objectProp.prop2' })
			input2UpdateFromUserInputMock.mockResolvedValueOnce('Updated Value 2')
			promptMock.mockResolvedValueOnce({ action: finishAction })

			input1SummarizeForEditMock.mockReturnValue('Summarized Input 1')
			input2SummarizeForEditMock.mockReturnValue('Summarized Input 2')

			expect(await def.updateFromUserInput(
				{ prop1: 'Item Value 1', objectProp: { prop2: 'Item Value 2' } },
			)).toEqual(
				{ prop1: 'Item Value 1', objectProp: { prop2: 'Updated Value 2' } },
			)

			expect(promptMock).toHaveBeenCalledTimes(2)
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
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

			promptMock.mockResolvedValueOnce({ action: 'objectProp' }) // outer object
			promptMock.mockResolvedValueOnce({ action: 'prop2' }) // nested object
			input2UpdateFromUserInputMock.mockResolvedValueOnce('Updated Value 2')
			promptMock.mockResolvedValueOnce({ action: finishAction }) // leave nested
			promptMock.mockResolvedValueOnce({ action: finishAction }) // finish outer

			input1SummarizeForEditMock.mockReturnValue('Summarized Input 1')
			input2SummarizeForEditMock.mockReturnValue('Summarized Input 2')

			expect(await def.updateFromUserInput(
				{ prop1: 'Item Value 1', objectProp: { prop2: 'Item Value 2' } },
			)).toEqual(
				{ prop1: 'Item Value 1', objectProp: { prop2: 'Updated Value 2' } },
			)

			expect(promptMock).toHaveBeenCalledTimes(4)
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: expect.arrayContaining([
					{ name: 'Edit Item Name 1: Summarized Input 1', value: 'prop1' },
					{ name: 'Edit Nested Object: Nested Object Summary', value: 'objectProp' },
				]),
			}))
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
				choices: expect.arrayContaining([
					{ name: 'Edit Item Name 2: Summarized Input 2', value: 'prop2' },
				]),
			}))
		})

		it('returns original when canceled', async () => {
			input1SummarizeForEditMock.mockReturnValue('Summarized Input 1')
			input2SummarizeForEditMock.mockReturnValue('Summarized Input 2')
			input3SummarizeForEditMock.mockReturnValue('Summarized Input 3')
			promptMock.mockResolvedValueOnce({ action: 'input2' })
			input2UpdateFromUserInputMock.mockResolvedValueOnce('Updated Input 2')
			promptMock.mockResolvedValueOnce({ action: cancelAction })

			const original = { input1: 'Item Value 1', input2: 'Item Value 2', 'input3': 'Item Value 3' }
			expect(await threeInputDef.updateFromUserInput(original)).toStrictEqual(original)

			expect(promptMock).toHaveBeenCalledTimes(2)

			expect(input1UpdateFromUserInputMock).toHaveBeenCalledTimes(0)
			expect(input2UpdateFromUserInputMock).toHaveBeenCalledTimes(1)
			expect(input2UpdateFromUserInputMock).toHaveBeenCalledWith('Item Value 2', [original])
			expect(input3UpdateFromUserInputMock).toHaveBeenCalledTimes(0)
			expect(input1SummarizeForEditMock).toHaveBeenCalled()
			expect(input2SummarizeForEditMock).toHaveBeenCalled()
			expect(input3SummarizeForEditMock).toHaveBeenCalled()
		})
	})
})
