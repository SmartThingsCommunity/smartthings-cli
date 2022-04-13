import at from 'lodash.at'
import { URL } from 'url'

import { logManager } from '../logger'
import { DefaultTableGenerator, TableFieldDefinition, TableGenerator } from '../table-generator'

import { debugMock, warnMock } from './test-lib/mock-logger'


jest.mock('../logger')
jest.mock('lodash.at', () => {
	const actualAt = jest.requireActual('lodash.at')
	return {
		__esModule: true,
		default: jest.fn(actualAt),
	}
})

/**
 * Quote characters that are special to regular expressions.
 * This isn't complete but it's good enough for this test.
 */
function quoteForRegex(str: string): string {
	return str.replace(/\./g, '\\.').replace(/\//g, '\\/')
}

/**
 * The output of the table command has escape sequences to change coloring.
 * These make it harder to validate so this method strips them.
 */
function stripEscapeSequences(str: string): string {
	let retVal = ''
	let inEscapeSequence = false
	for (let index = 0; index < str.length; index++) {
		if (inEscapeSequence && str.charAt(index) === 'm') {
			inEscapeSequence = false
		} else if (str.charCodeAt(index) === 27) {
			inEscapeSequence = true
		} else if (!inEscapeSequence) {
			retVal += str.charAt(index)
		}
	}
	return retVal
}

function rowCount(table: string): number {
	return table.split('\n').length - 2
}

// These are the characters the used by the cli-table library:
// \u250c ┌
// \u252c ┬
// \u2510 ┐
// \u2502 │
// \u2500 ─
// \u2514 └
// \u2534 ┴
// \u2518 ┘
// https://en.wikipedia.org/wiki/Box_Drawing_(Unicode_block)

expect.extend({
	toHaveLabel(received: string, label: string) {
		const stripped = stripEscapeSequences(received)
		const regex = new RegExp(`\u2502 +${quoteForRegex(label)} +\u2502 +[^\u2502]*? +\u2502`, 'g')
		return {
			message: (): string => `expected ${stripped} to have label ${label}`,
			pass: regex.test(stripped),
		}
	},
	toHaveValue(received: string, value: string) {
		const stripped = stripEscapeSequences(received)
		const regex = new RegExp(`\u2502 +[^\u2502]*? +\u2502 +${quoteForRegex(value)} +\u2502`, 'g')
		return {
			message: (): string => `expected ${stripped} to have value ${value}`,
			pass: regex.test(stripped),
		}
	},
	toHaveLabelAndValue(received: string, label: string, value: string) {
		const stripped = stripEscapeSequences(received)
		const regex = new RegExp(`\u2502 +${quoteForRegex(label)} +\u2502 +${quoteForRegex(value)} +\u2502`, 'g')
		return {
			message: (): string => `expected ${stripped} to have label ${label} and value ${value}`,
			pass: regex.test(stripped),
		}
	},
	toHaveItemValues(received: string, values: string[]) {
		const stripped = stripEscapeSequences(received)
		const valuesRegex = values.map(value => quoteForRegex(value)).join(' +\u2502 +')
		const regex = new RegExp(`\u2502 +${valuesRegex} +\u2502`, 'g')
		return {
			message: (): string => `expected ${stripped} to have values ${JSON.stringify(values)}`,
			pass: regex.test(stripped),
		}
	},
})

interface SimpleData {
	id?: string
	someNumber: number
	simpleField?: string
	reallyLongFieldName?: number
	requestUri?: string
	targetUrl?: URL
	subObject?: {
		subField?: string
		lambdaArnEU?: string
		redBarnShade?: string // "arn" in "barn" should not be capitalized
	}
	mightBeNull?: string | null
	isBurly?: boolean // contains "url" in name to ensure this doesn't get messed up
	ageInCenturies?: number // contains "uri"
	oAuthTokenUrl?: string
	oauthClientId?: string
}

const basicData = {
	id: 'uuid-here',
	someNumber: 14.4,
	reallyLongFieldName: 7.2,
	requestUri: 'a request URI',
	targetUrl: new URL('https://www.google.com'),
	simpleField: 'value',
	subObject: {
		subField: 'sub-field value',
		lambdaArnEU: 'ARN-value',
		redBarnShade: 'faded, very faded',
	},
	oAuthTokenUrl: 'https://my.token.url',
	oauthClientId: 'client-id',
}
const basicFieldDefinitions: TableFieldDefinition<SimpleData>[] = [
	'id',
	'simpleField',
	'reallyLongFieldName',
	'requestUri',
	'targetUrl',
	'subObject.subField',
	'isBurley',
	'ageInCenturies',
	'subObject.lambdaArnEU',
	'subObject.redBarnShade',
	'oAuthTokenUrl',
	'oauthClientId',
]

describe('tableGenerator', () => {
	const mockAt = jest.mocked(at)

	let tableGenerator: TableGenerator

	beforeEach(() => {
		tableGenerator = new DefaultTableGenerator(true)
	})

	it('buildTableFromItem converts simple column labels properly', function() {
		const output = tableGenerator.buildTableFromItem(basicData, basicFieldDefinitions)

		expect(output).toHaveLabel('Id')
		expect(output).toHaveLabel('Simple Field')
		expect(output).toHaveLabel('Really Long Field Name')
		expect(output).toHaveLabel('Request URI')
		// "URL" string should be made all caps
		expect(output).toHaveLabel('Target URL')
		expect(output).toHaveLabel('Sub Field')
		// "url" in "Burley" should NOT be all caps.
		expect(output).toHaveLabel('Burley')
		// "is" should be dropped for boolean-style fields
		expect(output).not.toHaveLabel('Is Burley')
		// "uri" string in "centuries" should not be made all caps
		expect(output).toHaveLabel('Age In Centuries')
		expect(output).toHaveLabel('Lambda ARN EU')
		expect(output).toHaveLabel('Red Barn Shade')
		expect(output).toHaveLabel('OAuth Token URL')
		expect(output).toHaveLabel('OAuth Client Id')
	})

	it('buildTableFromItem converts simple column values properly', function() {
		const output = tableGenerator.buildTableFromItem(basicData, basicFieldDefinitions)

		expect(output).toHaveValue('uuid-here')
		expect(output).toHaveValue('value')
		expect(output).toHaveValue('7.2')
		expect(output).toHaveLabelAndValue('Really Long Field Name', '7.2')
		expect(output).toHaveLabelAndValue('Request URI', 'a request URI')
		expect(output).toHaveLabelAndValue('Target URL', 'https://www.google.com/')
		expect(output).toHaveLabelAndValue('Sub Field', 'sub-field value')
	})

	it('buildTableFromItem uses specified column headings', function() {
		const basicFieldDefinitions = [{
			prop: 'reallyLongFieldName',
			label: 'Shorter Name',
		}]
		const output = tableGenerator.buildTableFromItem(basicData, basicFieldDefinitions)

		expect(output).not.toHaveLabel('Really Long Field Name')
		expect(output).toHaveLabel('Shorter Name')
	})

	it('buildTableFromItem uses calculated value', function() {
		const fieldDefinitions = [{
			prop: 'reallyLongFieldName',
			value: (item: SimpleData): string => `${item.reallyLongFieldName} ms`,
		}]
		const output = tableGenerator.buildTableFromItem(basicData, fieldDefinitions)

		expect(output).not.toHaveValue('7.2')
		expect(output).toHaveValue('7.2 ms')
	})

	it('buildTableFromItem uses empty string for undefined calculated value', function() {
		const fieldDefinitions = [{
			prop: 'reallyLongFieldName',
			value: (): string | undefined => undefined,
		}]
		const output = tableGenerator.buildTableFromItem(basicData, fieldDefinitions)

		expect(output).toHaveValue('')
	})

	it('buildTableFromItem skips rows when include returns false', function() {
		const fieldDefinitions = ['id', {
			prop: 'someNumber',
			include: (item: SimpleData): boolean => item.someNumber < 5,
		}]
		const output = tableGenerator.buildTableFromItem(basicData, fieldDefinitions)

		expect(output).toHaveLabelAndValue('Id', 'uuid-here')
		expect(output).not.toHaveLabel('Some Number')
		expect(rowCount(output)).toBe(1)
	})

	it('buildTableFromItem remembers to include rows when include returns true', function() {
		const fieldDefinitions = ['id', {
			prop: 'someNumber',
			include: (item: SimpleData): boolean => item.someNumber > 5,
		}]
		const output = tableGenerator.buildTableFromItem(basicData, fieldDefinitions)

		expect(output).toHaveLabelAndValue('Id', 'uuid-here')
		expect(output).toHaveLabelAndValue('Some Number', '14.4')
		expect(rowCount(output)).toBe(2)
	})

	it('buildTableFromItem skips falsy values with skipEmpty', function() {
		const fieldDefinitions = ['id', { prop: 'mightBeNull', skipEmpty: true }]
		const output = tableGenerator.buildTableFromItem(basicData, fieldDefinitions)

		expect(output).toHaveLabelAndValue('Id', 'uuid-here')
		expect(output).not.toHaveLabel('Might Be Null')
		expect(rowCount(output)).toBe(1)
	})

	it('buildTableFromItem include truthy values with skipEmpty', function() {
		const fieldDefinitions = ['id', { prop: 'mightBeNull', skipEmpty: true }]
		const output = tableGenerator.buildTableFromItem({ ...basicData, mightBeNull: 'not null' }, fieldDefinitions)

		expect(output).toHaveLabelAndValue('Id', 'uuid-here')
		expect(output).toHaveLabelAndValue('Might Be Null', 'not null')
		expect(rowCount(output)).toBe(2)
	})

	it('buildTableFromList generates the correct number of rows', function() {
		let output = tableGenerator.buildTableFromList([basicData], ['id', 'someNumber'])

		expect(rowCount(output)).toBe(3) // header, header separator and data row

		output = tableGenerator.buildTableFromList([basicData, basicData], ['id', 'someNumber'])
		expect(rowCount(output)).toBe(4) // header, header separator and two data rows
	})

	it('buildTableFromList generates the correct header', function() {
		const output = tableGenerator.buildTableFromList([basicData], ['id', 'someNumber'])

		expect(output).toHaveItemValues(['Id', 'Some Number'])
	})

	it('buildTableFromList generates the correct data values', function() {
		const output = tableGenerator.buildTableFromList([basicData], ['id', 'someNumber'])

		expect(output).toHaveItemValues(['uuid-here', '14.4'])
	})

	it('throws exception if value missing with no prop', () => {
		expect(() => tableGenerator.buildTableFromItem(basicData, [{ label: 'Label' }]))
			.toThrow('both label and value are required if prop is not specified')
	})

	it('throws exception if label missing with no prop', () => {
		expect(() => tableGenerator.buildTableFromItem(basicData, [{ value: () => 'some value' }]))
			.toThrow('both label and value are required if prop is not specified')
	})

	it('uses empty string for no match', () => {
		mockAt.mockReturnValue([])

		const output = tableGenerator.buildTableFromList([{}], ['fieldName'])

		expect(output).toHaveItemValues([''])
		expect(logManager.getLogger).toHaveBeenCalledTimes(1)
		expect(logManager.getLogger).toHaveBeenCalledWith('table-manager')
		expect(mockAt).toHaveBeenCalledTimes(1)
		expect(mockAt).toHaveBeenCalledWith({}, 'fieldName')
		expect(debugMock).toHaveBeenCalledTimes(1)
		expect(debugMock).toHaveBeenCalledWith('did not find match for fieldName in {}')
	})

	it('combines data on multiple matches', () => {
		mockAt.mockReturnValue(['one', 'two'])

		const output = tableGenerator.buildTableFromList([{}], ['fieldName'])

		expect(output).toHaveItemValues(['one, two'])
		expect(logManager.getLogger).toHaveBeenCalledTimes(1)
		expect(logManager.getLogger).toHaveBeenCalledWith('table-manager')
		expect(mockAt).toHaveBeenCalledTimes(1)
		expect(mockAt).toHaveBeenCalledWith({}, 'fieldName')
		expect(warnMock).toHaveBeenCalledTimes(1)
		expect(warnMock).toHaveBeenCalledWith('found more than one match for fieldName in {}')
	})

	it('gets logger only once', () => {
		tableGenerator.buildTableFromList([{}], ['fieldName'])
		expect(logManager.getLogger).toHaveBeenCalledTimes(1)
		expect(logManager.getLogger).toHaveBeenCalledWith('table-manager')
		tableGenerator.buildTableFromList([{}], ['fieldName'])
		expect(logManager.getLogger).toHaveBeenCalledTimes(1)
	})
})
