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
		// For object, only use the toString if it's not the default from `Object`.
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

export const delay = async (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

export const fatalError = (message?: string, code = 1): never => {
	if (message) {
		console.error(message)
	}
	// eslint-disable-next-line no-process-exit
	process.exit(code)
}

/**
 * Cancel running command with optional message. This would generally be chosen when the user
 * decides to cancel.
 */
export const cancelCommand = (message?: string): never => {
	// Even non-error messages go to stderr so we don't pollute JSON or YAML going to stdout.
	console.error(message ?? 'Action Canceled')

	// eslint-disable-next-line no-process-exit
	process.exit()
}

export const asTextBulletedList = (enums: string[]): string =>
	enums.length === 0 ? '' : ('\n  - ' + enums.join('\n  - '))
