import inquirer from 'inquirer'


export type ValidateFunction = (input: string) => true | string | Promise<true | string>
export type TransformerFunction = (input: string, answers: { value: string }, flags: { isFinal?: boolean | undefined }) => string | Promise<string>

/**
 * Converts the empty string entered by the user to the word 'none` for the user when entering
 * optional numbers.
 */
export const numberTransformer: TransformerFunction = (input, _, { isFinal }) => isFinal && input === '' ? 'none' : input

/**
 * Adjust the given validate function to always allow an empty value.
 */
export const allowEmptyFn = (validate: ValidateFunction): ValidateFunction =>
	(input: string): true | string | Promise<true | string> => input === '' || validate(input)

export type DefaultValueOrFn<T> = T | (() => T)
export type AskForStringOptions = {
	default?: DefaultValueOrFn<string>
	validate?: ValidateFunction
	helpText?: string
}

const promptForString = async (message: string, options: AskForStringOptions): Promise<string | undefined> => {
	const buildValidateFunction = (): ValidateFunction | undefined => {
		// When there is a validate method defined and we have help text, we have to allow '?'.
		if (options.helpText && options.validate) {
			return input => input === '?' || options.validate === undefined || options.validate(input)
		}

		return options.validate
	}

	const prompt = async (): Promise<string | undefined> => (await inquirer.prompt({
		type: 'input',
		name: 'value',
		message: options.helpText ? `${message} (? for help)` : message,
		validate: buildValidateFunction(),
		default: typeof options.default === 'function' ? options.default() : options.default,
	})).value as string | undefined

	let entered = await prompt()
	while (options.helpText && entered === '?') {
		console.log(options.helpText)
		entered = await prompt()
	}

	return entered
}

/**
 * Simple wrapper around querying a user for a string. The return value will always be a string
 * with at least one character or undefined.
 */
export const askForOptionalString = async (message: string, options?: AskForStringOptions): Promise<string | undefined> => {
	const updatedOptions = {
		...options,
		validate: options?.validate ? allowEmptyFn(options.validate) : undefined,
	}
	return await promptForString(message, updatedOptions) || undefined
}

/**
 * Simple wrapper around querying a user for a string. The return value will always be a string
 * which may be empty (unless a validation function is specified which disallows it).
 */
export const askForString = async (message: string, options?: AskForStringOptions): Promise<string> =>  {
	const updatedOptions = {
		...options,
		validate: (input: string) => input ? (options?.validate ? options.validate(input) : true) : 'value is required',
	}
	return await promptForString(message, updatedOptions) as string
}

export const askForInteger = async (message: string, min?: number, max?: number): Promise<number | undefined> => {
	const value = (await inquirer.prompt({
		// Since 'number' converts strings to NaN without warning or error before validate is
		// called, we use `input` here and just do our own validation. (It's possible to do some
		// error correction in `transformer` but you can't return an error.)
		type: 'input',
		name: 'value',
		message,
		transformer: numberTransformer,
		validate: input => {
			if (input === '') {
				return true
			}
			if (!input.match(/^-?\d+$/)) {
				return `${input} is not a valid integer`
			}
			const asNumber = Number(input)
			if (min !== undefined && asNumber < min) {
				return `must be no less than ${min}`
			}
			if (max !== undefined && asNumber > max) {
				return `must be no more than ${max}`
			}
			return true
		},
	})).value as string

	return value === '' ? undefined : Number(value)
}

export const askForNumber = async (message: string, min?: number, max?: number): Promise<number | undefined> => {
	const value = (await inquirer.prompt({
		type: 'input',
		name: 'value',
		message,
		transformer: numberTransformer,
		validate: input => {
			if (input === '') {
				return true
			}
			const asNumber = Number(input)
			if (isNaN(asNumber)) {
				return `${input} is not a valid number`
			}
			if (min !== undefined && asNumber < min) {
				return `must be no less than ${min}`
			}
			if (max !== undefined && asNumber > max) {
				return `must be no more than ${max}`
			}
			return true
		},
	})).value as string

	return value === '' ? undefined : Number(value)
}

export type AskForBooleanOptions = {
	/**
	 * Specify a default value for when the user hits enter. The default default is true.
	 */
	default?: boolean
}

export const askForBoolean = async (message: string, options?: AskForBooleanOptions): Promise<boolean> => {
	const answer = (await inquirer.prompt({
		type: 'confirm',
		name: 'answer',
		message,
		default: options?.default ?? true,
	})).answer as boolean

	return answer
}
