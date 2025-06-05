import inquirer, { ChoiceCollection } from 'inquirer'

import {
	booleanInput,
	BooleanInputOptions,
	integerInput,
	IntegerInputOptions,
	optionalIntegerInput,
	type DefaultValueOrFn,
	optionalStringInput,
	stringInput,
	type OptionalStringInputOptions,
	type ValidateFunction,
} from '../../lib/user-query.js'
import {
	type CancelAction,
	type InputDefinition,
	type InputDefinitionDefaultValueOrFn,
	type InputDefinitionValidateFunction,
	type Uneditable,
	cancelOption,
	uneditable,
} from '../../lib/item-input/defs.js'
import { stringFromUnknown } from '../util.js'


export const validateWithContextFn = <T>(
	validate?: InputDefinitionValidateFunction<T>,
	context?: unknown[],
): ValidateFunction<T> | undefined =>
	validate
		? (input: T): true | string => validate(input, context)
		: undefined

export const defaultWithContextFn = <T extends string | number>(
	def?: InputDefinitionDefaultValueOrFn<T>,
	context?: unknown[],
): DefaultValueOrFn<T> | undefined =>
	typeof def === 'function' ? () => def(context) : def

export type StringDefOptions = Omit<OptionalStringInputOptions, 'default' | 'validate'> & {
	default?: InputDefinitionDefaultValueOrFn<string>
	validate?: InputDefinitionValidateFunction<string>
}
export const optionalStringDef = (name: string, options?: StringDefOptions): InputDefinition<string | undefined> => {
	const buildFromUserInput = async (context?: unknown[]): Promise<string | undefined> =>
		optionalStringInput(`${name} (optional)`, {
			...options,
			default: defaultWithContextFn(options?.default, context),
			validate: validateWithContextFn(options?.validate, context),
		})
	const summarizeForEdit = (value: string): string => value
	const updateFromUserInput = (original: string, context?: unknown[]): Promise<string | undefined> =>
		optionalStringInput(`${name} (optional)`,
			{ ...options, default: original, validate: validateWithContextFn(options?.validate, context) })

	return { name, buildFromUserInput, summarizeForEdit, updateFromUserInput }
}

export const stringDef = (name: string, options?: StringDefOptions): InputDefinition<string> => {
	const buildFromUserInput = async (context?: unknown[]): Promise<string> =>
		stringInput(name,
			{
				...options,
				default: defaultWithContextFn(options?.default, context),
				validate: validateWithContextFn(options?.validate, context),
			})
	const summarizeForEdit = (value: string): string => value
	const updateFromUserInput = (original: string, context?: unknown[]): Promise<string> =>
		stringInput(name,
			{ ...options, default: original, validate: validateWithContextFn(options?.validate, context) })

	return { name, buildFromUserInput, summarizeForEdit, updateFromUserInput }
}

export type NumberDefOptions = Omit<IntegerInputOptions<number>, 'default'> & {
	default?: InputDefinitionDefaultValueOrFn<number>
}
export const optionalIntegerDef = (name: string, options?: NumberDefOptions): InputDefinition<number | undefined> => {
	const buildFromUserInput = async (context?: unknown[]): Promise<number | undefined> =>
		optionalIntegerInput(`${name} (optional)`, {
			...options,
			default: defaultWithContextFn(options?.default, context),
			validate: validateWithContextFn<number | undefined>(options?.validate, context),
		})
	const summarizeForEdit = (value: number | undefined): string => String(value)
	const updateFromUserInput = (original: number | undefined, context?: unknown[]): Promise<number | undefined> =>
		optionalIntegerInput(`${name} (optional)`,
			{ ...options, default: original, validate: validateWithContextFn<number | undefined>(options?.validate, context) })

	return { name, buildFromUserInput, summarizeForEdit, updateFromUserInput }
}
export const integerDef = (name: string, options?: NumberDefOptions): InputDefinition<number> => {
	const buildFromUserInput = async (context?: unknown[]): Promise<number> =>
		integerInput(name, {
			...options,
			default: defaultWithContextFn(options?.default, context),
			validate: validateWithContextFn<number | undefined>(options?.validate, context),
		})
	const summarizeForEdit = (value: number): string => String(value)
	const updateFromUserInput = (original: number | undefined, context?: unknown[]): Promise<number> =>
		integerInput(name,
			{ ...options, default: original, validate: validateWithContextFn<number | undefined>(options?.validate, context) })

	return { name, buildFromUserInput, summarizeForEdit, updateFromUserInput }
}

export type BooleanDefOptions = BooleanInputOptions
export const booleanDef = (name: string, options?: BooleanDefOptions): InputDefinition<boolean> => {
	const buildFromUserInput = async (): Promise<boolean> => booleanInput(name, options)
	const summarizeForEdit = (value: boolean): string => value ? 'Yes' : 'No'
	const updateFromUserInput = async (original: boolean): Promise<boolean> => booleanInput(name, { default: original })

	return { name, buildFromUserInput, summarizeForEdit, updateFromUserInput }
}

/**
 * Use a static definition if you only need a hard-coded value for a given field. The user will
 * never be asked or notified and the value specified will be used.
 */
export const staticDef = <T>(value: T): InputDefinition<T> => {
	const buildFromUserInput = async (): Promise<T> => value
	const summarizeForEdit = (): Uneditable => uneditable
	const updateFromUserInput = async (): Promise<T> => value
	return { name: 'unused', buildFromUserInput, summarizeForEdit, updateFromUserInput }
}

export const undefinedDef = staticDef(undefined)

export const computedDef = <T>(compute: (context?: unknown[]) => T): InputDefinition<T> => {
	const buildFromUserInput = async (context?: unknown[]): Promise<T> => compute(context)
	const summarizeForEdit = (): Uneditable => uneditable
	// TODO: consider how we might calling this if anything in the context prior to it is edited
	const updateFromUserInput = async (_original: T, context?: unknown[]): Promise<T> => compute(context)
	// TODO: implement updateIfNeeded
	return { name: 'unused', buildFromUserInput, summarizeForEdit, updateFromUserInput }
}

export type ListSelectionDefOptions<T> = {
	/**
	 * A summary of the object to display to the user in a list.
	 *
	 * The default is `stringFromUnknown`.
	 */
	summarizeForEdit?: (item: T, context?: unknown[]) => string

	default?: T

	helpText?: string
}

/**
 * Create an `InputDefinition` for selecting items from a list.
 */
export const listSelectionDef = <T=string>(name: string, validItems: T[], options?: ListSelectionDefOptions<T>): InputDefinition<T> => {
	const summarizeForEdit = options?.summarizeForEdit ?? stringFromUnknown

	const updateFromUserInput = async (original?: T): Promise<T | CancelAction> => {
		const choices: ChoiceCollection = validItems.map((validItem: T) => ({
			name: summarizeForEdit(validItem),
			value: validItem,
		}))
		choices.push(cancelOption)

		const chosen: T | CancelAction = (await inquirer.prompt({
			type: 'list',
			name: 'chosen',
			message: `Select ${name}:`,
			choices,
			default: original,
		})).chosen

		return chosen
	}

	const buildFromUserInput = async (): Promise<T | CancelAction> => updateFromUserInput(options?.default)

	return { name, buildFromUserInput, summarizeForEdit, updateFromUserInput }
}

export type OptionalDefPredicateFn = (context?: unknown[]) => boolean
export type OptionalDefOptions = {
	/**
	 * When using an `optionalDef` for an update, include this to indicate whether an optional
	 * def is active at the start or not.
	 */
	initiallyActive?: boolean
}
/**
 * Given an `InputDefinition`, `inputDef`, for type `T` and a predicate, checkIsActive, create a new
 * `InputDefinition` for type `T | undefined` that always resolves to `undefined` without consulting
 * the user if the predicate returns false. If the predicate returns true, the provided
 * `InputDefinition` is used to retrieve the value from the user.
 *
 * NOTES:
 *   - We don't save any previously entered value for if the predicate starts returning `false`
 *     after previously returning `true`. This could be implemented at a future date if it we decide
 *     it would be useful.
 */
export const optionalDef = <T>(inputDef: InputDefinition<T>, checkIsActive: OptionalDefPredicateFn, options?: OptionalDefOptions): InputDefinition<T | undefined> => {
	// In certain situations we need to know if the def has changed.
	let isActive = options?.initiallyActive ?? false
	const decideAndSave = (context?: unknown[]): boolean => {
		isActive = checkIsActive(context)
		return isActive
	}
	const buildFromUserInput = async (context?: unknown[]): Promise<T | undefined | CancelAction> =>
		decideAndSave(context) ? inputDef.buildFromUserInput(context) : undefined
	const summarizeForEdit = (value: T | undefined, context?: unknown[]): string | Uneditable =>
		isActive ? inputDef.summarizeForEdit(value as T, context) : uneditable
	const updateFromUserInput = async (original: T | undefined, context?: unknown[]): Promise<T | undefined | CancelAction> =>
		isActive
			? (original ? inputDef.updateFromUserInput(original as T, context) : inputDef.buildFromUserInput(context))
			: undefined

	const updateIfNeeded = async (original: T | undefined, updatedPropertyName: string | number | symbol, context?: unknown[]): Promise<T | undefined | CancelAction> => {
		const previouslyActive = isActive
		const currentlyActive = decideAndSave(context)
		if (previouslyActive && currentlyActive) {
			return inputDef.updateIfNeeded
				? inputDef.updateIfNeeded(original as T, updatedPropertyName, context)
				: original
		}
		if (currentlyActive && !previouslyActive) {
			return inputDef.buildFromUserInput(context)
		}
		return undefined
	}

	return { name: inputDef.name, buildFromUserInput, summarizeForEdit, updateFromUserInput, updateIfNeeded }
}
