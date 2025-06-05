import { jest } from '@jest/globals'

import {
	emailValidate,
	httpsURLValidate,
	localhostOrHTTPSValidate,
	numberValidateFn,
	stringValidateFn,
	urlValidate,
} from '../../lib/validate-util.js'


describe('stringValidateFn', () => {
	it.each`
		regex    | input
		${/abc/} | ${'abc'}
		${'and'} | ${'This and that'}
	`('passes "$input" using regex "$regex"', ({ regex, input }) => {
		const fn = stringValidateFn({ regex })
		expect(fn(input)).toBeTrue()
	})

	it.each`
		regex    | regexString | input
		${/abc/} | ${'/abc/'}  | ${'xyz'}
		${'and'} | ${'/and/'}  | ${'This or that'}
	`('rejects "$input" using regex "$regex"', ({ regex, regexString, input }) => {
		const fn = stringValidateFn({ regex })
		expect(fn(input)).toBe(`must match regex ${regexString}`)
	})

	it('uses custom error message when supplied', () => {
		const fn = stringValidateFn({ regex: /abc/, errorMessage: 'custom message' })
		expect(fn('non-matching input')).toBe('custom message')
	})

	it.each`
		minLength | input              | expected
		${12}     | ${'13 characters'} | ${true}
		${13}     | ${'13 characters'} | ${true}
		${14}     | ${'13 characters'} | ${'must be at least 14 characters'}
	`('validates minimum value', ({ minLength, input, expected }) => {
		const fn = stringValidateFn({ minLength })
		expect(fn(input)).toBe(expected)
	})

	it.each`
		maxLength | input              | expected
		${12}     | ${'13 characters'} | ${'must be no more than 12 characters'}
		${13}     | ${'13 characters'} | ${true}
		${14}     | ${'13 characters'} | ${true}
	`('validates maximum value', ({ maxLength, input, expected }) => {
		const fn = stringValidateFn({ maxLength })
		expect(fn(input)).toBe(expected)
	})

	it('rejects maxLength if less than minLength', () => {
		expect(() => stringValidateFn({ minLength: 5, maxLength: 4 }))
			.toThrow('maxLength must be >= minLength')
	})

	it.each`
		minLength | maxLength | input              | expected
		${13}     | ${13}     | ${'13 characters'} | ${true}
		${11}     | ${14}     | ${'13 characters'} | ${true}
		${7}      | ${12}     | ${'13 characters'} | ${'must be no more than 12 characters'}
		${14}     | ${20}     | ${'13 characters'} | ${'must be at least 14 characters'}
	`('validates minimum and maximum values', ({ minLength, maxLength, input, expected }) => {
		const fn = stringValidateFn({ minLength, maxLength })
		expect(fn(input)).toBe(expected)
	})
})

describe('numberValidateFn', () => {
	it('throws exception if min is greater than max', () => {
		expect(() => numberValidateFn({ min: 10, max: 9 })).toThrow('max must be >= min')
	})

	it('accepts nullish values', () => {
		expect(numberValidateFn()(null as unknown as undefined)).toBe(true)
		expect(numberValidateFn()(undefined)).toBe(true)
	})

	it.each`
		min   | input   | expected
		${12} | ${13} | ${true}
		${13} | ${13} | ${true}
		${14} | ${13} | ${'must be no less than 14'}
	`('validates minimum value', ({ min, input, expected }) => {
		const fn = numberValidateFn({ min })
		expect(fn(input)).toBe(expected)
	})

	it.each`
		max   | input   | expected
		${12} | ${13} | ${'must be no more than 12'}
		${13} | ${13} | ${true}
		${14} | ${13} | ${true}
	`('validates maximum value', ({ max, input, expected }) => {
		const fn = numberValidateFn({ max })
		expect(fn(input)).toBe(expected)
	})

	it.each`
		min   | max   | input   | expected
		${12} | ${14} | ${11} | ${'must be no less than 12'}
		${12} | ${14} | ${12} | ${true}
		${12} | ${14} | ${13} | ${true}
		${12} | ${14} | ${14} | ${true}
		${12} | ${14} | ${15} | ${'must be no more than 14'}
	`('validates minimum and maximum together value', ({ min, max, input, expected }) => {
		const fn = numberValidateFn({ min, max })
		expect(fn(input)).toBe(expected)
	})
})

describe('urlValidate', () => {
	it.each([
		'http://example.com',
		'https://example.com',
		'https://www.adafruit.com/category/168',
	])('accepts "%s"', (input) => {
		expect(urlValidate(input)).toBe(true)
	})

	it.each([
		'I love NeoPixels. I hope you do too.',
		'74',
		'http:/missing.a.slash',
	])('rejects "%s"', (input) => {
		expect(urlValidate(input)).toBe('must be a valid URL')
	})

	it.each([
		'fred://example.com',
		'ftp://example.com',
		'ftps://example.com',
	])('rejects "%s" with unsupported protocol', (input) => {
		expect(urlValidate(input)).toBe('http(s) protocol is required')
	})

	it('rethrows unexpected error', () => {
		const urlSpy = jest.spyOn(globalThis, 'URL')
		urlSpy.mockImplementationOnce(() => { throw Error('unexpected error') })
		expect(() => urlValidate('could be anything')).toThrow('unexpected error')
		urlSpy.mockRestore()
	})
})

describe('httpsURLValidate', () => {
	it.each([
		'I love NeoPixels. I hope you do too.',
		'74',
		'https:/missing.a.slash',
	])('rejects "%s" when https required', (input) => {
		expect(httpsURLValidate(input)).toBe('must be a valid URL with https protocol')
	})

	it.each([
		'https://example.com',
		'https://www.adafruit.com/category/168',
	])('accepts "%s" when https is required', (input) => {
		expect(httpsURLValidate(input)).toBe(true)
	})

	it.each([
		'http://adafruit.com',
		'fred://example.com',
		'ftp://example.com',
		'ftps://example.com',
	])('rejects "%s" when https required', (input) => {
		expect(httpsURLValidate(input)).toBe('https protocol is required')
	})
})

describe('localhostOrHTTPSValidate', () => {
	it.each([
		'https://example.com',
		'https://www.adafruit.com/category/168',
		'http://localhost/path/to/fun',
		'http://127.0.0.1',
		'http://localhost:3000',
		'http://127.0.0.1:3000/callback',
	])('accepts "%s" when https is required', (input) => {
		expect(localhostOrHTTPSValidate(input)).toBe(true)
	})

	it.each([
		'http://adafruit.com',
		'fred://example.com',
		'ftp://example.com',
		'ftps://example.com',
	])('rejects "%s" when https required', (input) => {
		expect(localhostOrHTTPSValidate(input)).toBe('https is required except for localhost')
	})
})

describe('emailValidate', () => {
	it.each([
		'',
		'@',
		'a@',
		'@b',
		'@example.com',
	])('rejects invalid email address %s', (invalidEmail) => {
		expect(emailValidate(invalidEmail)).toBe('must be a valid email address')
	})

	it.each([
		'you@example.com',
		'them@smartthings.com',
	])('accepts valid email address %s', (validEmail) => {
		expect(emailValidate(validEmail)).toBe(true)
	})
})
