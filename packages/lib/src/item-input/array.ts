import inquirer, { ChoiceCollection, DistinctChoice, Separator } from 'inquirer'
import { clipToMaximum, stringFromUnknown } from '../util'

import {
	addAction,
	addOption,
	cancelAction,
	CancelAction,
	cancelOption,
	deleteAction,
	deleteOption,
	editAction,
	editOption,
	FinishAction,
	finishAction,
	finishOption,
	InputDefinition,
	inquirerPageSize,
	maxItemValueLength,
	uneditable,
} from './defs'


export type ArrayDefOptions<T> = {
	/**
	 * A summary of the object to display to the user in a list.
	 *
	 * The default is call `summarizeForEdit` for each item and put them in a comma-separated list,
	 * clipped to 60 characters.
	 */
	summarizeForEdit?: (item: T[], context?: unknown[]) => string

	/**
	 * Whether duplicates are allowed in the output. The default is false.
	 */
	allowDuplicates?: boolean

	/**
	 * The minimum number of items required. Defaults to 1.
	 */
	minItems?: number

	/**
	 * The maximum number of items allowed. The default is to not have a limit.
	 */
	maxItems?: number
}

/**
 * InputDefinition for an array of items.
 *
 * @param itemDef Definition used to input or edit a single item.
 * @param options See definition of `ArrayDefOptions` for more details.
 */
export function arrayDef<T>(name: string, itemDef: InputDefinition<T>, options?: ArrayDefOptions<T>): InputDefinition<T[]> {
	const minItems = options?.minItems ?? 1

	const checkForDuplicate = (list: T[], value: T, index: number): boolean => {
		if (!options?.allowDuplicates && list.includes(value) && (index === -1 || list[index] !== value)) {
			console.log('Duplicate values are not allowed.')
			return false
		}
		return true
	}

	const itemSummary = (item: T): string => {
		const summary = itemDef.summarizeForEdit(item)
		if (summary === uneditable) {
			throw Error('The itemDef used for an arrayDef must be editable.')
		}
		return summary
	}

	const editItem = async (itemDef: InputDefinition<T>, list: T[], index: number, context: unknown[]): Promise<void> => {
		const currentValue = itemSummary(list[index])
		const choices: ChoiceCollection = [editOption(currentValue)]
		if (list.length > minItems) {
			choices.push(deleteOption(currentValue))
		}
		choices.push(cancelOption)

		const action = (await inquirer.prompt({
			type: 'list',
			name: 'action',
			message: `What do you want to do with ${currentValue}?`,
			choices,
			default: editAction,
		})).action

		if (action === editAction) {
			const response = await itemDef.updateFromUserInput(list[index], context)
			if (response !== cancelAction) {
				if (checkForDuplicate(list, response, index)) {
					list[index] = response
				}
			}
		} else if (action === deleteAction) {
			list.splice(index, 1)
		}
		// Nothing to do for cancelAction
	}

	// Common code from build and edit
	const editList = async (list: T[], context: unknown[]): Promise<FinishAction | CancelAction> => {
		// eslint-disable-next-line no-constant-condition
		while (true) {
			const choices: ChoiceCollection = list.map((item, index) => ({
				name: `Edit ${itemSummary(item)}.`,
				value: index,
			}))

			if (choices.length > 0) {
				choices.push(new Separator())
			}

			if (!options?.maxItems || list.length < options.maxItems) {
				choices.push(addOption(itemDef.name))
			}
			if (list.length >= minItems) {
				choices.push(finishOption(name))
			}
			choices.push(cancelOption)

			const action = (await inquirer.prompt({
				type: 'list',
				name: 'action',
				message: `Add or edit ${name}.`,
				choices,
				default: list.length >= minItems ? finishAction : addAction,
				pageSize: inquirerPageSize,
			})).action

			if (action === addAction) {
				const newValue = await itemDef.buildFromUserInput([[...list], ...context])
				if (newValue !== cancelAction && checkForDuplicate(list, newValue, -1)) {
					list.push(newValue)
				}
			} else if (typeof action === 'number') {
				await editItem(itemDef, list, action, context)
			} else if (action === finishAction) {
				return finishAction
			} else if (action === cancelAction) {
				return cancelAction
			} else {
				throw Error(`unexpected state in arrayDef; action = ${JSON.stringify(action)}`)
			}
		}
	}

	const buildFromUserInput = async (context: unknown[] = []): Promise<T[] | CancelAction> => {
		const retVal: T[] = []

		if (await editList(retVal, context) === finishAction) {
			return retVal
		}

		return cancelAction
	}

	const summarizeForEdit = options?.summarizeForEdit
		?? ((value: T[]) => clipToMaximum(value.map(item => itemDef.summarizeForEdit(item)).join(', '), maxItemValueLength))

	const updateFromUserInput = async (original: T[], context: unknown[] = []): Promise<T[] | CancelAction> => {
		const updated = [...original]

		if (await editList(updated, context) === finishAction) {
			return updated
		}

		return cancelAction
	}

	return { name, buildFromUserInput, summarizeForEdit, updateFromUserInput }
}

export type CheckboxDefOptions<T> = {
	/**
	 * A summary of the object to display to the user in a list.
	 *
	 * The default is to call `summarizeForEdit` for each item and put them in a
	 * comma-separated list, clipped to 60 characters.
	 */
	summarizeForEdit?: (item: T[], context?: unknown[]) => string

	validate?: (item: T[]) => string | true

	default?: T[]
}

type ComplexCheckboxDefItem<T> = {
	name: string
	value: T
}
export type CheckboxDefItem<T> = T extends string ? string | ComplexCheckboxDefItem<T> : ComplexCheckboxDefItem<T>

export function checkboxDef<T>(name: string, items: CheckboxDefItem<T>[], options?: CheckboxDefOptions<T>): InputDefinition<T[]> {
	const editValues = async (values: T[]): Promise<T[] | CancelAction> => {
		const choices: ChoiceCollection = items.map(item => {
			const value = typeof item === 'string' ? item as T : item.value
			if (values.includes(value)) {
				const retVal: DistinctChoice & { checked?: boolean } = typeof item === 'object' ? { ...item } : ({ name: item, value: item })
				retVal.checked = true
				return retVal
			}
			return item
		})
		const updatedValues = (await inquirer.prompt({
			type: 'checkbox',
			name: 'values',
			message: `Select ${name}.`,
			choices,
			default: finishAction,
			pageSize: inquirerPageSize,
			validate: options?.validate,
		})).values

		return updatedValues as T[]
	}

	const buildFromUserInput = async (): Promise<T[] | CancelAction> => editValues(options?.default ?? [])

	const summarizeForEdit = options?.summarizeForEdit
		?? ((value: T[]) => clipToMaximum(value.map(item => stringFromUnknown(item)).join(', '), maxItemValueLength))

	const updateFromUserInput = (original: T[]): Promise<T[] | CancelAction> => editValues(original)

	return { name, buildFromUserInput, summarizeForEdit, updateFromUserInput }
}
