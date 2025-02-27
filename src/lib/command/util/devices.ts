import { type AttributeState } from '@smartthings/core-sdk'


/**
 * Return a JSON-formatted value for a capability attribute with the unit appended if there is one.
 *
 * Since strings and numbers are valid JSON, if value is a string, this will return a quoted
 * string or just the number for a number.
 */
export const prettyPrintAttribute = (attribute: AttributeState): string => {
	const { unit, value } = attribute
	if (value == null) {
		return ''
	}

	let result = JSON.stringify(value)
	if (result.length > 50) {
		result = JSON.stringify(value, null, 2)
	}

	return `${result}${unit ? ' ' + unit : ''}`
}
