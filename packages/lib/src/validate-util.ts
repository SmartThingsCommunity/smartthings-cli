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
		return (input: string): true | string => {
			const regex = typeof options.regex === 'string' ? new RegExp(options.regex) : options.regex
			return regex.test(input) || (options.errorMessage ?? `must match regex ${regex}`)
		}
	}
	if ('minLength' in options && 'maxLength' in options && options.minLength > options.maxLength) {
		throw Error('maxLength must be >= minLength')
	}
	return (input: string): true | string => {
		if ('minLength' in options && input.length < options.minLength) {
			return `must be at least ${options.minLength} characters`
		}
		if ('maxLength' in options && input.length > options.maxLength) {
			return `must be no more than ${options.maxLength} characters`
		}
		return true
	}
}

type URLValidateFnOptions = {
	httpsRequired?: boolean

	/**
	 * Setting this to true (along with httpsRequired) will allow http protocol for localhost
	 * and 127.0.0.1.
	 */
	allowLocalhostHTTP?: boolean

	/**
	 * Required by default.
	 */
	required?: boolean
}

const allowedHTTPHosts = ['localhost', '127.0.0.1']
const urlValidateFn = (options?: URLValidateFnOptions): ValidateFunction => {
	return (input: string): true | string => {
		try {
			const url = new URL(input)
			if (options?.httpsRequired) {
				if (options?.allowLocalhostHTTP) {
					return url.protocol === 'https:' ||
						url.protocol === 'http:' && allowedHTTPHosts.includes(url.host) ||
						'https is required except for localhost'
				}
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

export const urlValidate = urlValidateFn()
export const httpsURLValidate = urlValidateFn({ httpsRequired: true })
export const localhostOrHTTPSValidate = urlValidateFn({ httpsRequired: true, allowLocalhostHTTP: true })
