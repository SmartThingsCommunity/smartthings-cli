import { askForString, askForOptionalString, AskForStringOptions, ValidateFunction } from '../user-query'
import { InputDefinition, InputDefinitionValidateFunction, Uneditable, uneditable } from './defs'


export const validateWithContextFn = (validate?: InputDefinitionValidateFunction, context?: unknown[]): ValidateFunction | undefined =>
	validate
		? (input: string): true | string | Promise<string | true> => validate(input, context)
		: undefined

export type StringDefOptions = Omit<AskForStringOptions, 'validate'> & {
	validate?: InputDefinitionValidateFunction
}
export const optionalStringDef = (name: string, options?: StringDefOptions): InputDefinition<string | undefined> => {
	const buildFromUserInput = async (context?: unknown[]): Promise<string | undefined> =>
		askForOptionalString(`${name} (optional)`,
			{ ...options, validate: validateWithContextFn(options?.validate, context) })
	const summarizeForEdit = (original: string): string => original
	const updateFromUserInput = (original: string, context?: unknown[]): Promise<string | undefined> =>
		askForOptionalString(`${name} (optional)`,
			{ ...options, default: original, validate: validateWithContextFn(options?.validate, context) })

	return { name, buildFromUserInput, summarizeForEdit, updateFromUserInput }
}

export const stringDef = (name: string, options?: StringDefOptions): InputDefinition<string> => {
	const buildFromUserInput = async (context?: unknown[]): Promise<string> =>
		askForString(name,
			{ ...options, validate: validateWithContextFn(options?.validate, context) })
	const summarizeForEdit = (value: string): string => value
	const updateFromUserInput = (original: string, context?: unknown[]): Promise<string> =>
		askForString(name,
			{ ...options, default: original, validate: validateWithContextFn(options?.validate, context) })

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

export const computedDef = <T>(compute: (context?: unknown[]) => T): InputDefinition<T> => {
	const buildFromUserInput = async (context?: unknown[]): Promise<T> => compute(context)
	const summarizeForEdit = (): Uneditable => uneditable
	// TODO: consider how we might calling this if anything in the context prior to it is edited
	const updateFromUserInput = async (_original: T, context?: unknown[]): Promise<T> => compute(context)
	return { name: 'unused', buildFromUserInput, summarizeForEdit, updateFromUserInput }
}
