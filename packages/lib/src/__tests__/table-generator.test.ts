import at from 'lodash.at'
import { URL } from 'url'
import log4js from '@log4js-node/log4js-api'
import { DefaultTableGenerator, stringFromUnknown, TableFieldDefinition, TableGenerator } from '../table-generator'


const mockDebug = jest.fn()
const mockWarn = jest.fn()

jest.mock('@log4js-node/log4js-api', () => ({
	getLogger: jest.fn(() => ({
		debug: mockDebug,
		warn: mockWarn,
	})),
}))

jest.mock('lodash.at', () => {
	const actualAt = jest.requireActual('lodash.at')
	return {
		// eslint-disable-next-line @typescript-eslint/naming-convention
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

/**
 * Clean up string created using backticks. Lines are stripped of ` +|` at the beginning of each
 * line (allowing indentation) and `|` at the end (allowing for spaces at the end of the line
 * that are not automatically removed by tooling). If there is a newline at the beginning of the
 * string, it is also removed.
 */
const fixIndent = (input: string): string => input.replace(/^\s*\|/gm, '').replace(/\|$/gm, '').replace(/^\n/, '')

const lineCount = (input: string): number =>(input.match(/\n/g) ?? []).length

expect.extend({
	toHaveLabel(received: string, label: string) {
		const stripped = stripEscapeSequences(received)
		const regex = new RegExp(` +${quoteForRegex(label)} +`, 'g')
		return {
			message: (): string => `expected ${stripped} to have label ${label}`,
			pass: regex.test(stripped),
		}
	},
	toHaveValue(received: string, value: string) {
		const stripped = stripEscapeSequences(received)
		const regex = new RegExp(` +${quoteForRegex(value)} +`, 'g')
		return {
			message: (): string => `expected ${stripped} to have value ${value}`,
			pass: regex.test(stripped),
		}
	},
	toHaveLabelAndValue(received: string, label: string, value: string) {
		const stripped = stripEscapeSequences(received)
		const regex = new RegExp(` +${quoteForRegex(label)} +${quoteForRegex(value)} +`, 'g')
		return {
			message: (): string => `expected ${stripped} to have label ${label} and value ${value}`,
			pass: regex.test(stripped),
		}
	},
	toHaveItemValues(received: string, values: string[]) {
		const stripped = stripEscapeSequences(received)
		const valuesRegex = values.map(value => quoteForRegex(value)).join(' +')
		const regex = new RegExp(` +${valuesRegex} +`, 'g')
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

const basicData: SimpleData = {
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
	{ path: 'subObject.subField' },
	'isBurly',
	'ageInCenturies',
	{ path: 'subObject.lambdaArnEU' },
	{ path: 'subObject.redBarnShade' },
	'oAuthTokenUrl',
	'oauthClientId',
]

describe('table-generator', () => {
	const mockAt = jest.mocked(at)
	const mockGetLogger = jest.mocked(log4js.getLogger)

	let tableGenerator: TableGenerator

	beforeEach(() => {
		tableGenerator = new DefaultTableGenerator(false)
	})

	describe('stringFromUnknown', () => {
		it.each`
			input                             | result
			${'string'}                       | ${'string'}
			${undefined}                      | ${''}
			${() => 5}                        | ${'<Function>'}
			${1}                              | ${'1'}
			${true}                           | ${'true'}
			${BigInt(5)}                      | ${'5'}
			${Symbol('symbol')}               | ${'Symbol(symbol)'}
			${{ toString: () => 'toString' }} | ${'toString'}
			${{ simple: 'object' }}           | ${'{"simple":"object"}'}
		`('converts $input to $result', ({ input, result }) => {
			expect(stringFromUnknown(input)).toBe(result)
		})
	})

	describe('buildTableFromItem', () => {
		it('converts simple column labels properly', function() {
			const output = tableGenerator.buildTableFromItem(basicData, basicFieldDefinitions)

			expect(output).toHaveLabel('Id')
			expect(output).toHaveLabel('Simple Field')
			expect(output).toHaveLabel('Really Long Field Name')
			expect(output).toHaveLabel('Request URI')
			// "URL" string should be made all caps
			expect(output).toHaveLabel('Target URL')
			expect(output).toHaveLabel('Sub Field')
			// "url" in "Burley" should NOT be all caps.
			expect(output).toHaveLabel('Burly')
			// "is" should be dropped for boolean-style fields
			expect(output).not.toHaveLabel('Is Burley')
			// "uri" string in "centuries" should not be made all caps
			expect(output).toHaveLabel('Age In Centuries')
			expect(output).toHaveLabel('Lambda ARN EU')
			expect(output).toHaveLabel('Red Barn Shade')
			expect(output).toHaveLabel('OAuth Token URL')
			expect(output).toHaveLabel('OAuth Client Id')
		})

		it('converts simple column values properly', function() {
			const output = tableGenerator.buildTableFromItem(basicData, basicFieldDefinitions)

			expect(output).toHaveValue('uuid-here')
			expect(output).toHaveValue('value')
			expect(output).toHaveValue('7.2')
			expect(output).toHaveLabelAndValue('Really Long Field Name', '7.2')
			expect(output).toHaveLabelAndValue('Request URI', 'a request URI')
			expect(output).toHaveLabelAndValue('Target URL', 'https://www.google.com/')
			expect(output).toHaveLabelAndValue('Sub Field', 'sub-field value')
		})

		it('uses specified column headings', function() {
			const basicFieldDefinitions: TableFieldDefinition<SimpleData>[] = [{
				prop: 'reallyLongFieldName',
				label: 'Shorter Name',
			}]
			const output = tableGenerator.buildTableFromItem(basicData, basicFieldDefinitions)

			expect(output).not.toHaveLabel('Really Long Field Name')
			expect(output).toHaveLabel('Shorter Name')
		})

		it('uses calculated value', function() {
			const fieldDefinitions: TableFieldDefinition<SimpleData>[] = [{
				prop: 'reallyLongFieldName',
				value: (item: SimpleData): string => `${item.reallyLongFieldName} ms`,
			}]
			const output = tableGenerator.buildTableFromItem(basicData, fieldDefinitions)

			expect(output).toHaveValue('7.2 ms')
		})

		it('uses empty string for undefined calculated value', function() {
			const fieldDefinitions: TableFieldDefinition<SimpleData>[] = [{
				label: 'Really Long Field Name',
				prop: 'reallyLongFieldName',
				value: (): string | undefined => undefined,
			}]
			const output = tableGenerator.buildTableFromItem(basicData, fieldDefinitions)

			expect(output).toBe(fixIndent(`
			|──────────────────────────|
			| Really Long Field Name   |
			|──────────────────────────|
			|`))
		})

		it('skips rows when include returns false', function() {
			const fieldDefinitions: TableFieldDefinition<SimpleData>[] = ['id', {
				prop: 'someNumber',
				include: (item: SimpleData): boolean => item.someNumber < 5,
			}]
			const output = tableGenerator.buildTableFromItem(basicData, fieldDefinitions)

			expect(output).toHaveLabelAndValue('Id', 'uuid-here')
			expect(output).not.toHaveLabel('Some Number')
			expect(lineCount(output)).toBe(3)
		})

		it('remembers to include rows when include returns true', function() {
			const fieldDefinitions: TableFieldDefinition<SimpleData>[] = ['id', {
				prop: 'someNumber',
				include: (item: SimpleData): boolean => item.someNumber > 5,
			}]
			const output = tableGenerator.buildTableFromItem(basicData, fieldDefinitions)

			expect(output).toHaveLabelAndValue('Id', 'uuid-here')
			expect(output).toHaveLabelAndValue('Some Number', '14.4')
			expect(lineCount(output)).toBe(4)
		})

		it('skips falsy values with skipEmpty', function() {
			const fieldDefinitions: TableFieldDefinition<SimpleData>[] =
				['id', { prop: 'mightBeNull', skipEmpty: true }]
			const output = tableGenerator.buildTableFromItem(basicData, fieldDefinitions)

			expect(output).toHaveLabelAndValue('Id', 'uuid-here')
			expect(output).not.toHaveLabel('Might Be Null')
			expect(lineCount(output)).toBe(3)
		})

		it('include truthy values with skipEmpty', function() {
			const fieldDefinitions: TableFieldDefinition<SimpleData>[] =
				['id', { prop: 'mightBeNull', skipEmpty: true }]
			const output = tableGenerator.buildTableFromItem({ ...basicData, mightBeNull: 'not null' }, fieldDefinitions)

			expect(output).toHaveLabelAndValue('Id', 'uuid-here')
			expect(output).toHaveLabelAndValue('Might Be Null', 'not null')
			expect(lineCount(output)).toBe(4)
		})

		it('handles all possible TableCellData types', () => {
			const item = {
				stringField: 'string',
				numberField: 'number',
				booleanField: true,
				undefinedField: undefined,
			}
			const output = tableGenerator.buildTableFromItem(item,
				['stringField', 'numberField', 'booleanField', 'undefinedField'])

			expect(output).toBe(fixIndent(`
				|─────────────────────────|
				| String Field     string |
				| Number Field     number |
				| Boolean Field    true   |
				| Undefined Field         |
				|─────────────────────────|
				|`))
		})
	})

	describe('buildTableFromList', () => {
		it('generates the correct number of rows', function() {
			let output = tableGenerator.buildTableFromList([basicData], ['id', 'someNumber'])

			expect(lineCount(output)).toBe(5) // top and bottom, header, header separator and data row

			output = tableGenerator.buildTableFromList([basicData, basicData], ['id', 'someNumber'])
			expect(lineCount(output)).toBe(6) // top and bottom, header, header separator and two data rows
		})

		it('generates the correct header', function() {
			const output = tableGenerator.buildTableFromList([basicData], ['id', 'someNumber'])

			expect(output).toHaveItemValues(['Id', 'Some Number'])
		})

		it('generates the correct data values', function() {
			const output = tableGenerator.buildTableFromList([basicData], ['id', 'someNumber'])

			expect(output).toHaveItemValues(['uuid-here', '14.4'])
		})

		it('uses empty string for no match', () => {
			mockAt.mockReturnValue([])

			const output = tableGenerator.buildTableFromList([{} as { obj?: string }], [{ path: 'obj.name' }])

			expect(output).toHaveItemValues([''])
			expect(mockGetLogger).toHaveBeenCalledTimes(1)
			expect(mockGetLogger).toHaveBeenCalledWith('table-manager')
			expect(mockAt).toHaveBeenCalledTimes(1)
			expect(mockAt).toHaveBeenCalledWith({}, 'obj.name')
			expect(mockDebug).toHaveBeenCalledTimes(1)
			expect(mockDebug).toHaveBeenCalledWith('did not find match for obj.name in {}')
		})

		it('combines data on multiple matches', () => {
			mockAt.mockReturnValue(['one', 'two'])

			const output = tableGenerator.buildTableFromList([{} as { obj?: string }], [{ path: 'obj.name' }])

			expect(output).toHaveItemValues(['one, two'])
			expect(mockGetLogger).toHaveBeenCalledTimes(1)
			expect(mockGetLogger).toHaveBeenCalledWith('table-manager')
			expect(mockAt).toHaveBeenCalledTimes(1)
			expect(mockAt).toHaveBeenCalledWith({}, 'obj.name')
			expect(mockWarn).toHaveBeenCalledTimes(1)
			expect(mockWarn).toHaveBeenCalledWith('found more than one match for obj.name in {}')
		})

		it('gets logger only once', () => {
			tableGenerator.buildTableFromList([{} as { obj?: string }], [{ path: 'obj.name' }])
			expect(mockGetLogger).toHaveBeenCalledTimes(1)
			expect(mockGetLogger).toHaveBeenCalledWith('table-manager')
			tableGenerator.buildTableFromList([{} as { obj?: string }], [{ path: 'obj.name' }])
			expect(mockGetLogger).toHaveBeenCalledTimes(1)
		})

		it('includes separators every 4 rows with grouping on', () => {
			const longList: SimpleData[] = [
				{ id: 'uno', someNumber: 10 },
				{ id: 'dos', someNumber: 9 },
				{ id: 'tres', someNumber: 8 },
				{ id: 'cuatro', someNumber: 7.2 },
				{ id: 'cinco', someNumber: 6 },
				{ id: 'seis', someNumber: 5 },
				{ id: 'siete', someNumber: 4 },
				{ id: 'ocho', someNumber: 3 },
			]

			const output = tableGenerator.buildTableFromList(longList, ['id', 'someNumber'])
			expect(lineCount(output)).toBe(12)
		})
	})
})
