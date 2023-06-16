import { stdin as mockStdin } from 'mock-stdin'
import { formatFromFilename, IOFormat, parseJSONOrYAML, readDataFromStdin, stdinIsTTY, yamlExists } from '../../lib/io-util.js'
import { validData, validYAML, SimpleType } from '../test-lib/simple-type.js'
import { existsSync } from 'fs'


jest.mock('fs', () => {
	// if this isn't done, something breaks with sub-dependency 'fs-extra'
	const originalLib = jest.requireActual('fs')

	return {
		...originalLib,
		existsSync: jest.fn(),
	}
})

describe('formatFromFilename', () => {
	it('handles yaml extensions', function () {
		expect(formatFromFilename('fn.yaml')).toBe(IOFormat.YAML)
		expect(formatFromFilename('fn.yml')).toBe(IOFormat.YAML)
		expect(formatFromFilename('fn.YAML')).toBe(IOFormat.YAML)
	})

	it('handles json extensions', function () {
		expect(formatFromFilename('fn.json')).toBe(IOFormat.JSON)
		expect(formatFromFilename('fn.JSON')).toBe(IOFormat.JSON)
	})

	it('defaults to YAML', function () {
		expect(formatFromFilename('fn')).toBe(IOFormat.YAML)
	})
})

describe('parseJSONOrYAML', () => {
	it('returns data from valid yaml', function () {
		const result = parseJSONOrYAML<SimpleType>(validYAML, 'source')

		expect(result).toEqual(validData)
	})

	it('throws error with no data', function () {
		expect(() => parseJSONOrYAML('', 'empty')).toThrow('did not get any data from empty')
	})

	it('throws error with simple string data', function () {
		expect(() => parseJSONOrYAML('just a string', 'empty')).toThrow('got simple string from empty')
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

describe('stdinIsTTY', () => {
	it('returns true inside a test', function () {
		Object.defineProperty(process.stdin, 'isTTY', { value: true })
		expect(stdinIsTTY()).toBe(true)
	})
})

describe('yamlExists', () => {
	const mockExistsSync = jest.mocked(existsSync)
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { /* do nothing */})

	it.each([
		'config.ini',
		'config',
		'',
		'/Users/user/.config/@smartthings/cli',
		'c:\\users\\user\\AppData\\Local',
	])('throws error when %s is checked', (path) => {
		expect(() => yamlExists(path)).toThrow('Invalid file extension')
		expect(mockExistsSync).not.toBeCalled()
	})

	it.each([
		'config.yaml',
		'/Users/user/.config/@smartthings/cli/config.yaml',
		'c:\\users\\user\\AppData\\Local\\config.yaml',
	])('returns true when %s is checked and exists', (path) => {
		mockExistsSync.mockReturnValueOnce(true)

		expect(yamlExists(path)).toBe(true)
	})

	it.each([
		'config.yaml',
		'/Users/user/.config/@smartthings/cli/config.yaml',
		'c:\\users\\user\\AppData\\Local\\config.yaml',
	])('warns and returns false when %s is checked but .yml exists', (path) => {
		mockExistsSync
			.mockReturnValueOnce(false)
			.mockReturnValueOnce(true)

		expect(yamlExists(path)).toBe(false)
		expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Please use ".yaml" extension instead'))
	})
})
