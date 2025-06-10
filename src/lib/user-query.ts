import { confirm, input } from '@inquirer/prompts'


/**
 * Simplified, generic version of type required by `inquirer` for validation functions, which
 * inquirer does not export.
 */
export type ValidateFunction<T> = (input: T) => true | string

/**
 * Simplified, generic version of type required by `inquirer` for transformer functions, which
 * inquirer does not export.
 */
export type TransformerFunction = (input: string, flags: { isFinal?: boolean | undefined }) => string

// Converts the empty string entered by the user to the word 'none` for the user when entering optional numbers.
export const displayNoneForEmpty: TransformerFunction = (input, { isFinal }) => isFinal && input === '' ? 'none' : input

export type DefaultValueOrFn<T> = T | (() => T)

export type OptionalStringInputOptions = {
	default?: DefaultValueOrFn<string | undefined>
	validate?: ValidateFunction<string>
	helpText?: string
}
const internalStringInput = async (
		message: string,
		options: OptionalStringInputOptions & { required: boolean },
): Promise<string> => {
	const optValidate = options.validate
	const validate = (options?.helpText && optValidate)
		? (input: string) => input === '?' || optValidate(input)
		: optValidate
	const question = {
		message: options?.helpText ? `${message} (? for help)` : message,
		default: typeof options?.default === 'function' ? options.default() : options?.default,
		validate,
		required: options.required,
	}

	let entered = await input(question)
	while (options?.helpText && entered === '?') {
		console.log(options.helpText)
		entered = await input(question)
	}

	return entered
}

export const optionalStringInput = async (
		message: string,
		options?: OptionalStringInputOptions,
): Promise<string | undefined> => {
	const internalOptions = { ...options, required: false }
	// ensure empty input is allowed regardless of the validator
	const originalValidate = internalOptions.validate
	if (originalValidate) {
		internalOptions.validate = input => !input || originalValidate(input)
	}
	const entered = await internalStringInput(message, internalOptions)

	// inquirer returns an empty string when nothing entered; convert that to undefined
	return entered ? entered : undefined
}

export type StringInputOptions =
	& Omit<OptionalStringInputOptions, 'default'>
	& {
		default?: DefaultValueOrFn<string | undefined>
	}
export const stringInput = async ( message: string, options?: StringInputOptions ): Promise<string> =>
	internalStringInput(message, { ...options, required: true })

export type IntegerInputOptions<T extends number | undefined> = {
	default?: DefaultValueOrFn<T>

	/**
	 * A validation function targeted at `inquirer`'s input method. For simple min/max validation,
	 * use `numberValidateFn`.
	 */
	validate?: ValidateFunction<number | undefined>

	helpText?: string
}

const internalIntegerInput = async (
		message: string,
		options: IntegerInputOptions<number | undefined> & { required: boolean },
): Promise<number | undefined> => {
	const validate = (input: string): true | string => {
		if (options?.helpText && input === '?') {
			return true
		}

		if (!options.required && input === '') {
			return true
		}

		if (!input.match(/^-?\d+$/)) {
			return `"${input}" is not a valid integer`
		}

		if (!options.validate) {
			return true
		}

		return options.validate(Number(input))
	}

	// Using `inquirer`'s `number` function instead of `input` would be nice but it doesn't allow
	// us to accept `?` for help text.
	const prompt = async (): Promise<string | undefined> => await input({
		message: options.helpText ? `${message} (? for help)` : message,
		transformer: displayNoneForEmpty,
		validate,
		default: (typeof options.default === 'function' ? options.default() : options.default)?.toString(),
		required: options.required,
	})

	let entered = await prompt()
	while (options.helpText && entered === '?') {
		console.log(options.helpText)
		entered = await prompt()
	}

	return entered ? Number(entered) : undefined
}

/**
 * Prompt the user for an optional integer. The return value will always be a number that is an
 * integer or undefined.
 */
export const optionalIntegerInput = async (
		message: string,
		options?: IntegerInputOptions<number | undefined>,
): Promise<number | undefined> =>
	await internalIntegerInput(message, { ...options, required: false })

/**
 * Simple wrapper around querying a user for a string. The return value will always be a string
 * which may be empty (unless a validation function is specified which disallows it).
 */
export const integerInput = async (message: string, options?: IntegerInputOptions<number>): Promise<number> =>
	await internalIntegerInput(message, { ...options, required: true }) as number


export type NumberInputOptions = {
	default?: DefaultValueOrFn<number>

	/**
	 * A validation function targeted at `inquirer`'s prompt method. Note that `inquirer` input is
	 * always a string, so this method gets the raw `string` entered by the user (not a `number`).
	 * For simple min/max validation, use `integerValidateFn`.
	 */
	validate?: ValidateFunction<number | undefined>

	helpText?: string
}

export const internalNumberInput = async (
		message: string,
		options: NumberInputOptions & { required: boolean },
): Promise<number | undefined> => {
	// Using `inquirer`'s `number` function instead of `input` would be nice but it doesn't allow
	// us to accept `?` for help text.
	const prompt = async (): Promise<string> => await input({
		...options,
		message: options.helpText ? `${message} (? for help)` : message,
		transformer: displayNoneForEmpty,
		validate: input => {
			if (options.helpText && input === '?') {
				return true
			}
			if (input === '') {
				return true
			}
			const asNumber = Number(input)
			if (isNaN(asNumber)) {
				return `"${input}" is not a valid number`
			}
			return options.validate ? options.validate(asNumber) : true
		},
		default: (typeof options.default === 'function' ? options.default() : options.default)?.toString(),
		required: options.required,
	})

	let entered = await prompt()
	while (options.helpText && entered === '?') {
		console.log(options.helpText)
		entered = await prompt()
	}

	return entered ? Number(entered) : undefined
}

export const optionalNumberInput = async (
		message: string,
		options?: NumberInputOptions,
): Promise<number | undefined> =>
	internalNumberInput(message, { ...options, required: false })

export const numberInput = async (
		message: string,
		options?: NumberInputOptions,
): Promise<number> =>
	await internalNumberInput(message, { ...options, required: true }) as number

export type BooleanInputOptions = {
	/**
	 * Specify a default value for when the user hits enter. The default default is true.
	 */
	default?: boolean
}

export const booleanInput = async (message: string, options?: BooleanInputOptions): Promise<boolean> =>
	confirm({ message, default: options?.default ?? true })
