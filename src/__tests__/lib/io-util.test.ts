import { jest } from '@jest/globals'

import type { existsSync } from 'fs'

import { stdin as mockStdin } from 'mock-stdin'

import type { fatalError } from '../../lib/util.js'
import { validData, validYAML, SimpleType } from '../test-lib/simple-type.js'


const existsSyncMock = jest.fn<typeof existsSync>()
jest.unstable_mockModule('fs', () => ({
	default: {
		existsSync: existsSyncMock,
	},
}))

const fatalErrorMock = jest.fn<typeof fatalError>().mockReturnValue('never return' as never)
jest.unstable_mockModule('../../lib/util.js', () => ({
	fatalError: fatalErrorMock,
}))


const { formatFromFilename, parseJSONOrYAML, readDataFromStdin, stdinIsTTY, yamlExists } =
	await import('../../lib/io-util.js')


describe('formatFromFilename', () => {
	it('handles yaml extensions', function () {
		expect(formatFromFilename('fn.yaml')).toBe('yaml')
		expect(formatFromFilename('fn.yml')).toBe('yaml')
		expect(formatFromFilename('fn.YAML')).toBe('yaml')
	})

	it('handles json extensions', function () {
		expect(formatFromFilename('fn.json')).toBe('json')
		expect(formatFromFilename('fn.JSON')).toBe('json')
	})

	it('defaults to YAML', function () {
		expect(formatFromFilename('fn')).toBe('yaml')
	})
})

describe('parseJSONOrYAML', () => {
	it('returns data from valid yaml', function () {
		const result = parseJSONOrYAML<SimpleType>(validYAML, 'source')

		expect(result).toEqual(validData)
	})

	it('throws error with no data', function () {
		expect(parseJSONOrYAML('', 'empty')).toBe('never return')

		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith('did not get any data from empty')
	})

	it('throws error with simple string data', function () {
		expect(parseJSONOrYAML('just a string', 'empty')).toBe('never return')

		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith('got simple string from empty')
	})
})

describe('readDataFromStdin', () => {
	it('returns data from valid yaml', async function () {
		const stdinMock = mockStdin()
		stdinMock.reset()

		const result = readDataFromStdin()

		stdinMock.send(validYAML, 'utf-8')
		stdinMock.end()
		stdinMock.restore()

		await expect(result).resolves.toEqual(validYAML)
	})

	it('passes on error', async function () {
		jest.spyOn(process.stdin, 'resume').mockImplementation(() => { throw Error('pass through') })
		await expect(readDataFromStdin()).rejects.toThrow('pass through')
	})
})

test('stdinIsTTY', () => {
	Object.defineProperty(process.stdin, 'isTTY', { value: true })
	expect(stdinIsTTY()).toBe(true)
})

describe('yamlExists', () => {
	it.each([
		'config.ini',
		'config',
		'',
		'/Users/user/.config/@smartthings/cli',
		'c:\\users\\user\\AppData\\Local',
	])('throws error when %s is checked', (path) => {
		expect(yamlExists(path)).toBe('never return')
		expect(existsSyncMock).not.toHaveBeenCalled()

		expect(fatalErrorMock)
			.toHaveBeenCalledExactlyOnceWith(expect.stringContaining('Invalid file extension: '))
	})

	it.each([
		'config.yaml',
		'/Users/user/.config/@smartthings/cli/config.yaml',
		'c:\\users\\user\\AppData\\Local\\config.yaml',
	])('returns true when %s is checked and exists', (path) => {
		existsSyncMock.mockReturnValueOnce(true)

		expect(yamlExists(path)).toBe(true)

		expect(existsSyncMock).toHaveBeenCalledTimes(1)
		expect(existsSyncMock).toHaveBeenCalledWith(path)
	})

	it.each([
		'config.yaml',
		'/Users/user/.config/@smartthings/cli/config.yaml',
		'c:\\users\\user\\AppData\\Local\\config.yaml',
	])('warns and returns false when %s is checked but .yml exists', (path) => {
		const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { /*no-op*/ })
		existsSyncMock
			.mockReturnValueOnce(false)
			.mockReturnValueOnce(true)

		expect(yamlExists(path)).toBe(false)
		expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Please use ".yaml" extension instead'))
	})
})
