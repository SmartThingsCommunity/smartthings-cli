import { ValidateFunction } from './user-query'


export type RegExStringValidationOptions = {
	regex: string | RegExp

	/**
	 * The default error message is "must match regex ${regex}" which isn't terribly user-friendly.
	 * Use `errorMessage` to provide a more friendly error message.
	 */
	errorMessage?: string
}
export type MinLengthStringValidationOptions = {
	minLength: number
}

export type MaxLengthStringValidationOptions = {
	maxLength: number
}

export type MinMaxLengthStringValidationOptions = MinLengthStringValidationOptions & MaxLengthStringValidationOptions

export type StringValidationOptions =
	| RegExStringValidationOptions
	| MinLengthStringValidationOptions
	| MaxLengthStringValidationOptions
	| MinMaxLengthStringValidationOptions

/**
 * Builds a function that conforms to `ValidateFunction` that requires a string to match the given
 * conditions.
 */
export const stringValidateFn = (options: StringValidationOptions): ValidateFunction => {
	if ('regex' in options) {
		return (input: string): boolean | string => {
			const regex = typeof options.regex === 'string' ? new RegExp(options.regex) : options.regex
			return regex.test(input) || (options.errorMessage ?? `must match regex ${regex}`)
		}
	}
	if ('minLength' in options && 'maxLength' in options && options.minLength > options.maxLength) {
		throw Error('maxLength must be >= minLength')
	}
	return (input: string): boolean | string => {
		if ('minLength' in options && input.length < options.minLength) {
			return `must be at least ${options.minLength} characters`
		}
		if ('maxLength' in options && input.length > options.maxLength) {
			return `must be no more than ${options.maxLength} characters`
		}
		return true
	}
}

export const urlValidateFn = (options?: { httpsRequired?: boolean }): ValidateFunction => {
	return (input: string): boolean | string => {
		try {
			const url = new URL(input)
			if (options?.httpsRequired) {
				return url.protocol === 'https:' || 'https protocol is required'
			}
			return url.protocol === 'https:' || url.protocol === 'http:' || 'http(s) protocol is required'
		} catch (error) {
			if (error.code === 'ERR_INVALID_URL') {
				return `must be a valid URL${options?.httpsRequired ? ' with https protocol' : ''}`
			} else {
				throw error
			}
		}
	}
}
