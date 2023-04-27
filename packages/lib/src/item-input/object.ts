import inquirer, { ChoiceCollection, Separator } from 'inquirer'

import {
	cancelAction,
	CancelAction,
	cancelOption,
	FinishAction,
	finishAction,
	finishOption,
	InputDefinition,
	inquirerPageSize,
	uneditable,
} from './defs'


export type InputDefsByProperty<T> = { [Property in keyof T]: InputDefinition<T[Property]> }
export type ObjectDefOptions<T> = {
	/**
	 * A summary of the object to display to the user in a list.
	 *
	 * This is required for nested objects whose properties are not rolled up into the parent's
	 * question set. For nested objects whose properties are all rolled up, this can be omitted
	 * as it would not be used anyway.
	 */
	summarizeForEdit?: (item: T, context?: unknown[]) => string

	/**
	 * Only valid for nested objects. This controls whether the properties in this object
	 * should be queried as a separate sub-object or as more questions in the parent object.
	 * The default is to roll up if this object contains up to three properties.
	 */
	rollup?: boolean
}

const defaultSummarizeForEditFn = (name: string) => (): string => { throw Error(`missing implementation of summarizeForEdit for objectDef ${name}`) }
export type ObjectItemTypeData<T> = {
	type: 'object'
	inputDefsByProperty: InputDefsByProperty<T>
	rolledUp: boolean
}

const maxPropertiesForDefaultRollup = 3

// TODO: deal with optional objects
//    rolled up: make all items optional or don't allow rollup for optional classes?
// TODO: refactor to reduce nesting complexity
/**
 * Create a definition for an object. This will most often be the top-level input definition but
 * it can be used for sub-objects as well.
 *
 * The user will be queried for the properties in `inputDefsByProperty` in order. Note that
 * JavaScript iterates over properties with string keys in _insertion_ order.
 * (https://stackoverflow.com/questions/5525795/does-javascript-guarantee-object-property-order/38218582#38218582)
 *
 * If this definition is for a nested object whose properties are not rolled up into the questions
 * of its parent, you must include `summarizeForEdit` in `options`.
 */
export function objectDef<T extends object>(name: string, inputDefsByProperty: InputDefsByProperty<T>,
		options?: ObjectDefOptions<T>): InputDefinition<T> {
	const buildFromUserInput = async (context: unknown[] = []): Promise<T | CancelAction> => {
		const retVal = {} as Partial<T>
		for (const propertyName in inputDefsByProperty) {
			const propertyInputDefinition = inputDefsByProperty[propertyName]
			// Allow `undefined` definitions, but do nothing with them. This allows callers of
			// `objectDef` to have a field skipped by setting it to `undefined` as well as by leaving
			// it out.
			if (!propertyInputDefinition) {
				continue
			}
			const value = await propertyInputDefinition.buildFromUserInput([{ ...retVal }, ...context])
			if (value !== cancelAction) {
				retVal[propertyName] = value
			} else {
				return cancelAction
			}
		}
		return retVal as T
	}

	const summarizeForEdit = options?.summarizeForEdit ?? defaultSummarizeForEditFn(name)

	const updateFromUserInput = async (original: T, context: unknown[] = []): Promise<T | CancelAction> => {
		const updated = { ...original }
		// eslint-disable-next-line no-constant-condition
		while (true) {
			const contextForChildren = [{ ...updated }, ...context]
			const choices = [] as ChoiceCollection
			for (const propertyName in inputDefsByProperty) {
				const propertyInputDefinition = inputDefsByProperty[propertyName]
				if (!propertyInputDefinition) {
					continue
				}
				const propertyValue = updated[propertyName]
				if (propertyInputDefinition.itemTypeData?.type === 'object' &&
						(propertyInputDefinition.itemTypeData as ObjectItemTypeData<unknown>).rolledUp) {
					// nested property that is rolled up
					const itemTypeData = propertyInputDefinition.itemTypeData as ObjectItemTypeData<unknown>
					for (const nestedPropertyName in itemTypeData.inputDefsByProperty) {
						const nestedPropertyInputDefinition =
							(itemTypeData.inputDefsByProperty as { [key: string]: InputDefinition<unknown> })[nestedPropertyName]
						const nestedItem = (propertyValue as { [key: string]: unknown })[nestedPropertyName]
						const summary = nestedPropertyInputDefinition.summarizeForEdit(nestedItem, contextForChildren)
						if (summary !== uneditable) {
							choices.push({
								name: `Edit ${nestedPropertyInputDefinition.name}: ${summary}`,
								value: `${propertyName}.${nestedPropertyName}`,
							})
						}
					}
				} else {
					// top-level property
					const summary = propertyInputDefinition.summarizeForEdit(propertyValue, contextForChildren)
					if (summary !== uneditable) {
						choices.push({
							name: `Edit ${propertyInputDefinition.name}: ${summary}`,
							value: propertyName,
						})
					}
				}
			}
			choices.push(new Separator())
			choices.push(finishOption(name))
			choices.push(cancelOption)

			const action = (await inquirer.prompt({
				type: 'list',
				name: 'action',
				message: name,
				choices,
				default: finishAction,
				pageSize: inquirerPageSize,
			})).action as string | CancelAction | FinishAction

			if (action === cancelAction) {
				return original
			}
			if (action === finishAction) {
				return updated
			}

			const props = action.split('.')

			const propertyName = props[0] as keyof T
			const propertyInputDefinition = inputDefsByProperty[propertyName]
			if (props.length === 1) {
				// top-level property
				const updatedProperty = await propertyInputDefinition.updateFromUserInput(updated[propertyName], contextForChildren)
				if (updatedProperty !== cancelAction) {
					updated[propertyName] = updatedProperty
				}
			} else {
				// nested property that is rolled up
				const nestedPropertyName = props[1]
				const itemTypeData = propertyInputDefinition.itemTypeData as ObjectItemTypeData<unknown>

				const objectValue = updated[propertyName] as { [key: string]: unknown }

				const nestedPropertyInputDefinition =
					(itemTypeData.inputDefsByProperty as { [key: string]: InputDefinition<unknown> })[nestedPropertyName]

				const updatedProperty = await nestedPropertyInputDefinition.updateFromUserInput(
					objectValue[nestedPropertyName],
					contextForChildren,
				)
				if (updatedProperty !== cancelAction) {
					objectValue[nestedPropertyName] = updatedProperty
				}
			}
		}
	}

	const rolledUp = options?.rollup
		?? Object.values(inputDefsByProperty).filter(value => !!value).length <= maxPropertiesForDefaultRollup
	const itemTypeData: ObjectItemTypeData<T> = { type: 'object', inputDefsByProperty, rolledUp }

	return { name, buildFromUserInput, summarizeForEdit, updateFromUserInput, itemTypeData }
}
