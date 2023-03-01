import { clipToMaximum, stringFromUnknown } from '../util'


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

describe('clipToMaximum', () => {
	it.each`
		input             | maxLength     | result
		${'12345'}        | ${5}          | ${'12345'}
		${'12345'}        | ${6}          | ${'12345'}
		${'12345'}        | ${4}          | ${'1...'}
	`('converts $input to $result', ({ input, maxLength, result }) => {
		expect(clipToMaximum(input, maxLength)).toBe(result)
	})
})
