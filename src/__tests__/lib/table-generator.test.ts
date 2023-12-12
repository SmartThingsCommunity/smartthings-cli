import { jest } from '@jest/globals'

import { URL } from 'url'

import { TableFieldDefinition } from '../../lib/table-generator.js'


const { getLoggerMock, debugMock, warnMock } = await import('../test-lib/logger-mock.js')

const original = (await import('lodash.at')).default
const atMock = jest.fn(original)
jest.unstable_mockModule('lodash.at', async () => ({ default: atMock }))


// eslint-disable-next-line @typescript-eslint/naming-convention
const { defaultTableGenerator } = await import('../../lib/table-generator.js')


/**
 * Quote characters that are special to regular expressions.
 * This isn't complete but it's good enough for this test.
 */
const quoteForRegex = (str: string): string => str.replace(/\./g, '\\.').replace(/\//g, '\\/')

/**
 * The output of the table command has escape sequences to change coloring.
 * These make it harder to validate so this method strips them.
 */
const stripEscapeSequences = (str: string): string => {
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

type SimpleData = {
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
	describe('defaultTableGenerator', () => {
		it('produces TableGenerator with "table-generator" logger', () => {
			expect(defaultTableGenerator({ groupRows: false })).toStrictEqual(expect.objectContaining({
				newOutputTable: expect.any(Function),
				buildTableFromItem: expect.any(Function),
				buildTableFromList: expect.any(Function),
			}))

			expect(getLoggerMock).toHaveBeenCalledTimes(1)
			expect(getLoggerMock).toHaveBeenCalledWith('table-manager')
		})
	})

	describe('newOutputTable', () => {
		it('groups rows for a list when requested in defaultTableGenerator', () => {
			const tableGenerator = defaultTableGenerator({ groupRows: true })

			const table = tableGenerator.newOutputTable({ isList: true })
			for (let count = 0; count < 7; ++count) {
				table.push(['row', 'data'])
			}

			const output = table.toString()
			expect(lineCount(output)).toBe(11)
		})

		it('does not group rows for a list when requested in defaultTableGenerator', () => {
			const tableGenerator = defaultTableGenerator({ groupRows: false })

			const table = tableGenerator.newOutputTable({ isList: true })
			for (let count = 0; count < 7; ++count) {
				table.push(['row', 'data'])
			}

			const output = table.toString()
			expect(lineCount(output)).toBe(10)
		})

		it('`groupRows` value passed to `newTableOutput` overrides value passed to `defaultTableGenerator`', () => {
			const tableGenerator = defaultTableGenerator({ groupRows: false })

			const table = tableGenerator.newOutputTable({ groupRows: true, isList: true })
			for (let count = 0; count < 7; ++count) {
				table.push(['row', 'data'])
			}

			const output = table.toString()
			expect(lineCount(output)).toBe(11)
		})
	})

	describe('buildTableFromItem', () => {
		it('converts simple column labels properly', () => {
			const tableGenerator = defaultTableGenerator({ groupRows: false })

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

		it('converts simple column values properly', () => {
			const tableGenerator = defaultTableGenerator({ groupRows: false })

			const output = tableGenerator.buildTableFromItem(basicData, basicFieldDefinitions)

			expect(output).toHaveValue('uuid-here')
			expect(output).toHaveValue('value')
			expect(output).toHaveValue('7.2')
			expect(output).toHaveLabelAndValue('Really Long Field Name', '7.2')
			expect(output).toHaveLabelAndValue('Request URI', 'a request URI')
			expect(output).toHaveLabelAndValue('Target URL', 'https://www.google.com/')
			expect(output).toHaveLabelAndValue('Sub Field', 'sub-field value')
		})

		it('uses specified column headings', () => {
			const tableGenerator = defaultTableGenerator({ groupRows: false })

			const basicFieldDefinitions: TableFieldDefinition<SimpleData>[] = [{
				prop: 'reallyLongFieldName',
				label: 'Shorter Name',
			}]
			const output = tableGenerator.buildTableFromItem(basicData, basicFieldDefinitions)

			expect(output).not.toHaveLabel('Really Long Field Name')
			expect(output).toHaveLabel('Shorter Name')
		})

		it('uses calculated value', () => {
			const tableGenerator = defaultTableGenerator({ groupRows: false })

			const fieldDefinitions: TableFieldDefinition<SimpleData>[] = [{
				prop: 'reallyLongFieldName',
				value: (item: SimpleData): string => `${item.reallyLongFieldName} ms`,
			}]
			const output = tableGenerator.buildTableFromItem(basicData, fieldDefinitions)

			expect(output).toHaveValue('7.2 ms')
		})

		it('uses empty string for undefined calculated value', () => {
			const tableGenerator = defaultTableGenerator({ groupRows: false })

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

		it('skips rows when include returns false', () => {
			const tableGenerator = defaultTableGenerator({ groupRows: false })

			const fieldDefinitions: TableFieldDefinition<SimpleData>[] = ['id', {
				prop: 'someNumber',
				include: (item: SimpleData): boolean => item.someNumber < 5,
			}]
			const output = tableGenerator.buildTableFromItem(basicData, fieldDefinitions)

			expect(output).toHaveLabelAndValue('Id', 'uuid-here')
			expect(output).not.toHaveLabel('Some Number')
			expect(lineCount(output)).toBe(3)
		})

		it('remembers to include rows when include returns true', () => {
			const tableGenerator = defaultTableGenerator({ groupRows: false })

			const fieldDefinitions: TableFieldDefinition<SimpleData>[] = ['id', {
				prop: 'someNumber',
				include: (item: SimpleData): boolean => item.someNumber > 5,
			}]
			const output = tableGenerator.buildTableFromItem(basicData, fieldDefinitions)

			expect(output).toHaveLabelAndValue('Id', 'uuid-here')
			expect(output).toHaveLabelAndValue('Some Number', '14.4')
			expect(lineCount(output)).toBe(4)
		})

		it('skips falsy values with skipEmpty', () => {
			const tableGenerator = defaultTableGenerator({ groupRows: false })

			const fieldDefinitions: TableFieldDefinition<SimpleData>[] =
				['id', { prop: 'mightBeNull', skipEmpty: true }]
			const output = tableGenerator.buildTableFromItem(basicData, fieldDefinitions)

			expect(output).toHaveLabelAndValue('Id', 'uuid-here')
			expect(output).not.toHaveLabel('Might Be Null')
			expect(lineCount(output)).toBe(3)
		})

		it('include truthy values with skipEmpty', () => {
			const tableGenerator = defaultTableGenerator({ groupRows: false })

			const fieldDefinitions: TableFieldDefinition<SimpleData>[] =
				['id', { prop: 'mightBeNull', skipEmpty: true }]
			const output = tableGenerator.buildTableFromItem({ ...basicData, mightBeNull: 'not null' }, fieldDefinitions)

			expect(output).toHaveLabelAndValue('Id', 'uuid-here')
			expect(output).toHaveLabelAndValue('Might Be Null', 'not null')
			expect(lineCount(output)).toBe(4)
		})

		it('handles all possible TableCellData types', () => {
			const tableGenerator = defaultTableGenerator({ groupRows: false })

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
		it('generates the correct number of rows', () => {
			const tableGenerator = defaultTableGenerator({ groupRows: false })

			let output = tableGenerator.buildTableFromList([basicData], ['id', 'someNumber'])

			expect(lineCount(output)).toBe(5) // top and bottom, header, header separator and data row

			output = tableGenerator.buildTableFromList([basicData, basicData], ['id', 'someNumber'])
			expect(lineCount(output)).toBe(6) // top and bottom, header, header separator and two data rows
		})

		it('generates the correct header', () => {
			const tableGenerator = defaultTableGenerator({ groupRows: false })

			const output = tableGenerator.buildTableFromList([basicData], ['id', 'someNumber'])

			expect(output).toHaveItemValues(['Id', 'Some Number'])
		})

		it('generates the correct data values', () => {
			const tableGenerator = defaultTableGenerator({ groupRows: false })

			const output = tableGenerator.buildTableFromList([basicData], ['id', 'someNumber'])

			expect(output).toHaveItemValues(['uuid-here', '14.4'])
		})

		it('uses empty string for no match', () => {
			const tableGenerator = defaultTableGenerator({ groupRows: false })

			atMock.mockReturnValue([])

			const output = tableGenerator.buildTableFromList([{} as { obj?: string }], [{ path: 'obj.name' }])

			expect(output).toHaveItemValues([''])
			expect(atMock).toHaveBeenCalledTimes(1)
			expect(atMock).toHaveBeenCalledWith({}, 'obj.name')
			expect(debugMock).toHaveBeenCalledTimes(1)
			expect(debugMock).toHaveBeenCalledWith('did not find match for obj.name in {}')
		})

		it('combines data on multiple matches', () => {
			const tableGenerator = defaultTableGenerator({ groupRows: false })

			atMock.mockReturnValue(['one', 'two'])

			const output = tableGenerator.buildTableFromList([{} as { obj?: string }], [{ path: 'obj.name' }])

			expect(output).toHaveItemValues(['one, two'])
			expect(atMock).toHaveBeenCalledTimes(1)
			expect(atMock).toHaveBeenCalledWith({}, 'obj.name')
			expect(warnMock).toHaveBeenCalledTimes(1)
			expect(warnMock).toHaveBeenCalledWith('found more than one match for obj.name in {}')
		})

		it('includes separators every 4 rows with grouping on', () => {
			const tableGenerator = defaultTableGenerator({ groupRows: false })

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
