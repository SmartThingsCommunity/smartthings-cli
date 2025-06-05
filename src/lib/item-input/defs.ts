import { DistinctChoice } from 'inquirer'


export const uneditable = Symbol('uneditable')
export type Uneditable = typeof uneditable

/**
 * The core interface for an input definition. This interface describes a definition of an object
 * being input by the user. These definitions can be shared between creation and updating.
 *
 * T is the type of the object being entered. This can be anything from a simple string to a complex
 * object.
 *
 * The `context` in these objects is a chain of parent objects being created. The direct parent
 * will be `context[0]` and the root should be `context[context.length - 1]`. In the simplest
 * case of a primitive object being queried, there will never be any context. In the case of
 * a simple object with several primitives, the context will be an array of the object being
 * built when calling methods on `InputDefinition`s for the primitives.
 */
export type InputDefinition<T> = {
	/**
	 * A simple name for the item being requested from the user. This name will be used when
	 * querying the user.
	 */
	name: string

	/**
	 * Ask the user for data needed to build an instance of `T` and return that instance.
	 *
	 * This method would normally be used in a `create` command to allow user input data.
	 */
	buildFromUserInput(context?: unknown[]): Promise<T | CancelAction>

	/**
	 * Build a short, one-line string summary of the item to display to the user when listing items
	 * for editing.
	 */
	summarizeForEdit(value: T, context?: unknown[]): string | Uneditable

	/**
	 * Present the user with the data in `original` and allow them to edit it. Return a new instance
	 * with the updated values. (Unchanged values will be included as well; if the user does not
	 * change anything, the returned value will be a deep copy of the original.)
	 *
	 * This method would normally be used in `create` after `buildFromUserInput` is called
	 * and in `update` to allow editing of previously edited data.
	 */
	updateFromUserInput(original: T, context?: unknown[]): Promise<T | CancelAction>

	// TODO: maybe add dependencies between fields somehow for objectDef?
	// 		"predicate" option for fields in objectDef?
	/**
	 * If provided, this method will be called on subsequent items in an object definition
	 * when a change is made to one.
	 *
	 * Use cases:
	 *   1. computed values need to be recomputed when things they depend upon have changed
	 *   2. when selection made for one field leads to a different set of later fields requiring input
	 */
	updateIfNeeded?: <U extends T>(original: U, updatedPropertyName: string | number | symbol, context?: unknown[]) => Promise<T | CancelAction>

	/**
	 * Specific item types can include data here for reference outside the definition builder.
	 * Currently this is used by object-type item definitions so parent definitions can access
	 * child definition properties for rolled up properties.
	 */
	itemTypeData?: { type: 'object' }

	/**
	 * Optional final validation. Most validation should be done on each field as it's entered
	 * or updated but sometimes in a more complex object, a final validation needs to be used.
	 *
	 * Return true if the object is valid or a string error message if not.
	 */
	validateFinal?: <U extends T>(item: U, context?: unknown[]) => true | string
}

/**
 * Validation function specific to `ItemDefinition`. This can be considered to be an "extends"
 * of `ValidationFunction` since `context` is optional. i.e. Any function that conforms to
 * `ValidateFunction` will work for a `InputDefinitionValidateFunction` as well.
 */
export type InputDefinitionValidateFunction<T> = (input: T, context?: unknown[]) => true | string
export type DefaultValueFunction<T> = (context?: unknown[]) => T
export type InputDefinitionDefaultValueOrFn<T> = T | DefaultValueFunction<T>

export const addAction = Symbol('add')
export type AddAction = typeof addAction
export const addOption = (name: string): DistinctChoice => ({ name: `Add ${name}.`, value: addAction })

export const editAction = Symbol('edit')
export type EditAction = typeof editAction
export const editOption = (name: string): DistinctChoice => ({ name: `Edit ${name}.`, value: editAction })

export const deleteAction = Symbol('delete')
export type DeleteAction = typeof deleteAction
export const deleteOption = (name: string): DistinctChoice => ({ name: `Delete ${name}.`, value: deleteAction })

export const cancelAction = Symbol('cancel')
export type CancelAction = typeof cancelAction
export const cancelOption: DistinctChoice = ({ name: 'Cancel', value: cancelAction })

export const finishAction = Symbol('finish')
export type FinishAction = typeof finishAction
export const finishOption = (name: string): DistinctChoice => ({ name: `Finish editing ${name}.`, value: finishAction })

export const helpAction = Symbol('help')
export type HelpAction = typeof helpAction
export const helpOption: DistinctChoice = ({ name: 'Help', value: helpAction })

export const previewJSONAction = Symbol('previewJSON')
export const previewYAMLAction = Symbol('previewYAML')

export const maxItemValueLength = 60
export const inquirerPageSize = 20
