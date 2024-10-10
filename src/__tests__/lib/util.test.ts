import { jest } from '@jest/globals'

import {
	cancelCommand,
	clipToMaximum,
	delay,
	fatalError,
	sanitize,
	stringFromUnknown,
} from '../../lib/util.js'


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

describe('sanitize', () => {
	it.each`
		input                             | result
		${'string'}                       | ${'string'}
		${undefined}                      | ${''}
		${'bell bot tom'}                 | ${'bellbottom'}
		${'air-b-rush'}                   | ${'airbrush'}
		${'corn/b/all'}                   | ${'cornball'}
		${'&air*c=raft...85'}             | ${'aircraft85'}
	`('converts $input to $result', ({ input, result }) => {
		expect(sanitize(input)).toBe(result)
	})
})

test('delay', async () => {
	const beforeDate = new Date().getTime()
	await delay(3)
	expect(new Date().getTime()).toBeGreaterThanOrEqual(beforeDate + 2)
})

describe('fatalError', () => {
	const exitSpy = jest.spyOn(process, 'exit')
		// fake exiting with a special thrown error
		.mockImplementation(() => { throw Error('should exit') })
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { /*no-op*/ })

	it('prints message when given', () => {
		expect(() => fatalError('message for user')).toThrow('should exit')

		expect(consoleErrorSpy).toHaveBeenCalledWith('message for user')
		expect(exitSpy).toHaveBeenCalledExactlyOnceWith(1)
	})

	it('uses specified code when given', () => {
		expect(() => fatalError(undefined, 12)).toThrow('should exit')

		expect(exitSpy).toHaveBeenCalledExactlyOnceWith(12)
	})
})

describe('cancelCommand', () => {
	const exitSpy = jest.spyOn(process, 'exit')
		// fake exiting with a special thrown error
		.mockImplementation(() => { throw Error('should exit') })
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { /*no-op*/ })

	it('prints message when given', () => {
		expect(() => cancelCommand('message for user')).toThrow('should exit')

		expect(consoleErrorSpy).toHaveBeenCalledWith('message for user')
		expect(exitSpy).toHaveBeenCalledExactlyOnceWith()
	})

	it('defaults to "Action Canceled', () => {
		expect(() => cancelCommand()).toThrow('should exit')

		expect(consoleErrorSpy).toHaveBeenCalledWith('Action Canceled')
		expect(exitSpy).toHaveBeenCalledExactlyOnceWith()
	})
})
