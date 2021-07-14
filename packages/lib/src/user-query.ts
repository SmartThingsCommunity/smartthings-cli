import inquirer from 'inquirer'


export type ValidateFunction = (input: string) => boolean | string | Promise<boolean | string>
export type TransformerFunction = (input: string, answers: { value: string }, flags: { isFinal?: boolean | undefined }) => string | Promise<string>

/**
 * Converts the empty string entered by the user to the word 'none` for the user when entering
 * optional numbers.
 */
export const numberTransformer: TransformerFunction = (input, _, { isFinal }) => isFinal && input === '' ? 'none' : input

/**
 * Simple wrapper around querying a user for a string. The return value will always be
 * a string with at least one character or undefined.
 */
export const askForString = async (message: string, validate?: ValidateFunction): Promise<string | undefined> => {
	const value = (await inquirer.prompt({
		type: 'input',
		name: 'value',
		message,
		validate,
	})).value as string

	return value || undefined
}

export const askForRequiredString = async (message: string): Promise<string> =>
	askForString(message, (input: string) => input ? true : 'value is required') as Promise<string>

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
