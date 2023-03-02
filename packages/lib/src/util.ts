export const stringFromUnknown = (input: unknown): string => {
	if (typeof input === 'string') {
		return input
	}
	if (input == undefined) {
		return ''
	}
	if (typeof input === 'function') {
		return '<Function>'
	}
	if (typeof input === 'number' || typeof input == 'boolean' || typeof input === 'bigint' ||
			typeof input === 'symbol') {
		return input.toString()
	}
	if (typeof input === 'object') {
		// For object, only use the toString if it's not the default
		if (input.toString !== Object.prototype.toString) {
			return input.toString()
		}
	}
	return JSON.stringify(input)
}

/**
 * Clip the input string to the maximum length, using ellipses if it is too long.
 */
export const clipToMaximum = (input: string, maxLength: number): string =>
	input.length > maxLength
		? `${input.slice(0, maxLength - 3)}...`
		: input

/**
 * Returns a string with any non-word characters (anything but letters, numbers or the underscore)
 * removed. This function also returns an empty string if the input is undefined.
 */
export const sanitize = (input?: string): string => input?.replace(/[\W]/g, '') ?? ''
