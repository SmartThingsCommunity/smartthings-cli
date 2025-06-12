import { inspect } from 'node:util'

import { checkbox, select, Separator } from '@inquirer/prompts'

import { clipToMaximum, stringFromUnknown } from '../util.js'

import {
	addAction,
	addOption,
	cancelAction,
	CancelAction,
	cancelOption,
	type CheckboxChoice,
	type Choice,
	deleteAction,
	deleteOption,
	editAction,
	editOption,
	FinishAction,
	finishAction,
	finishOption,
	helpAction,
	helpOption,
	type InputDefinition,
	inquirerPageSize,
	maxItemValueLength,
	uneditable,
} from './defs.js'


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

	helpText?: string
}

/**
 * InputDefinition for an array of items, entered via the supplied `InputDefinition`, `inputDef`.
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
		const choices: Choice<T | symbol>[] = [editOption(currentValue)]
		if (list.length > minItems) {
			choices.push(deleteOption(currentValue))
		}
		choices.push(cancelOption)

		const action = await select({
			message: `What do you want to do with ${currentValue}?`,
			choices,
			default: editAction,
		})

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
			const choices: (Choice<symbol | number>)[] = list.map((item, index) => ({
				name: `Edit ${itemSummary(item)}.`,
				value: index,
			}))

			if (choices.length > 0) {
				choices.push(new Separator())
			}

			if (options?.helpText) {
				choices.push(helpOption)
			}
			if (!options?.maxItems || list.length < options.maxItems) {
				choices.push(addOption(itemDef.name))
			}
			if (list.length >= minItems) {
				choices.push(finishOption(name))
			}
			choices.push(cancelOption)

			const action = await select({
				message: `Add or edit ${name}.`,
				choices,
				default: list.length >= minItems ? finishAction : addAction,
				pageSize: inquirerPageSize,
			})

			if (action === addAction) {
				const newValue = await itemDef.buildFromUserInput([[...list], ...context])
				if (newValue !== cancelAction && checkForDuplicate(list, newValue, -1)) {
					list.push(newValue)
				}
			} else if (action === helpAction) {
				console.log(`\n${options?.helpText}\n`)
			} else if (typeof action === 'number') {
				await editItem(itemDef, list, action, context)
			} else if (action === finishAction) {
				return finishAction
			} else if (action === cancelAction) {
				return cancelAction
			} else {
				throw Error(`unexpected state in arrayDef; action = ${inspect(action)}`)
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

/**
 * Simplified version of type required by `inquirer` for checkbox validation function, which
 * inquirer does not export.
 */
export type CheckboxValidateFunction<T> = (choices: readonly CheckboxChoice<T>[]) => true | string

export type CheckboxDefOptions<T> = {
	/**
	 * A summary of the object to display to the user in a list.
	 *
	 * The default is to call `summarizeForEdit` for each item and put them in a
	 * comma-separated list, clipped to 60 characters.
	 */
	summarizeForEdit?: (item: T[], context?: unknown[]) => string

	validate?: CheckboxValidateFunction<T>

	default?: T[]

	helpText?: string
}

type ComplexCheckboxDefItem<T> = {
	name: string
	value: T
}
export type CheckboxDefItem<T> = T extends string ? string | ComplexCheckboxDefItem<T> : ComplexCheckboxDefItem<T>

export function checkboxDef<T>(
		name: string,
		items: CheckboxDefItem<T>[],
		options?: CheckboxDefOptions<T>,
): InputDefinition<T[]> {
	const editValues = async (values: T[]): Promise<T[] | CancelAction> => {
		// We can't add help to the inquirer `checkbox` so, at least for now, we'll display
		// the help before we display the checkbox.
		if (options?.helpText) {
			console.log(`\n${options.helpText}\n`)
		}
		const choices: CheckboxChoice<T>[] = items.map(item => {
			const value = typeof item === 'string' ? item as T : item.value
			const retVal: CheckboxChoice<T> = typeof item === 'object'
				? { ...item }
				: ({ name: item, value })
			if (values.includes(value)) {
				retVal.checked = true
			}
			return retVal
		})
		const question = {
			message: `Select ${name}.`,
			choices,
			default: finishAction,
			pageSize: inquirerPageSize,
			validate: options?.validate,
		}
		const updatedValues = await checkbox(question)

		return updatedValues as T[]
	}

	const buildFromUserInput = (): Promise<T[] | CancelAction> => editValues(options?.default ?? [])

	const summarizeForEdit = options?.summarizeForEdit
		?? ((value: T[]) => clipToMaximum(value.map(item => stringFromUnknown(item)).join(', '), maxItemValueLength))

	const updateFromUserInput = (original: T[]): Promise<T[] | CancelAction> => editValues(original)

	return { name, buildFromUserInput, summarizeForEdit, updateFromUserInput }
}
