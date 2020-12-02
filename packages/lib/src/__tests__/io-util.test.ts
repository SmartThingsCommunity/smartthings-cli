import { stdin as mockStdin } from 'mock-stdin'

import { NoLogLogger } from '@smartthings/core-sdk'

import { formatFromFilename, IOFormat, parseJSONOrYAML, readDataFromStdin, stdinIsTTY } from '../io-util'
import { LogManager } from '../logger'


export interface SimpleType {
	num: number
	str: string
}

export const validYAML = 'num: 5\nstr: my string'
export const validData = { num: 5, str: 'my string' }

afterEach(() => {
	jest.clearAllMocks()
})

describe('formatFromFilename', () => {
	it('handles yaml extensions', function() {
		expect(formatFromFilename('fn.yaml')).toBe(IOFormat.YAML)
		expect(formatFromFilename('fn.yml')).toBe(IOFormat.YAML)
		expect(formatFromFilename('fn.YAML')).toBe(IOFormat.YAML)
	})

	it('handles json extensions', function() {
		expect(formatFromFilename('fn.json')).toBe(IOFormat.JSON)
		expect(formatFromFilename('fn.JSON')).toBe(IOFormat.JSON)
	})

	it('defaults to YAML', function() {
		jest.spyOn(LogManager.prototype, 'getLogger').mockImplementation(() => {
			return new NoLogLogger()
		})
		expect(formatFromFilename('fn')).toBe(IOFormat.YAML)
	})
})

describe('parseJSONOrYAML', () => {
	it('returns data from valid yaml', function() {
		const result = parseJSONOrYAML<SimpleType>(validYAML, 'source')

		expect(result).toEqual(validData)
	})

	it('throws error with no data', function() {
		expect(() => parseJSONOrYAML('', 'empty')).toThrow('did not get any data from empty')
	})

	it('throws error with simple string data', function() {
		expect(() => parseJSONOrYAML('just a string', 'empty')).toThrow('got simple string from empty')
	})
})

describe('readDataFromStdin', () => {
	it('returns data from valid yaml', async function() {
		const stdinMock = mockStdin()
		stdinMock.reset()

		const result = readDataFromStdin()

		stdinMock.send(validYAML, 'utf-8')
		stdinMock.end()
		stdinMock.restore()

		await expect(result).resolves.toEqual(validYAML)
	})

	it('passes on error', async function() {
		jest.spyOn(process.stdin, 'resume').mockImplementation(() => { throw Error('pass through') })
		await expect(readDataFromStdin()).rejects.toThrow('pass through')
	})
})

describe('stdinIsTTY', () => {
	it('returns true inside a test', function() {
		Object.defineProperty(process.stdin, 'isTTY', { value: true })
		expect(stdinIsTTY()).toBe(true)
	})
})
