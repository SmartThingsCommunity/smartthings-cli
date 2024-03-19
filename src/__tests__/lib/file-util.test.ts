import { jest } from '@jest/globals'

import fs from 'fs'

import yaml from 'js-yaml'

import { YAMLFileData } from '../../lib/file-util.js'


const readFileSyncMock = jest.fn<typeof fs.readFileSync>()
const statMock = jest.fn<typeof fs.promises.stat>()
const lstatMock = jest.fn<typeof fs.promises.lstat>()
const realpathMock = jest.fn<typeof fs.promises.realpath>()
jest.unstable_mockModule('fs', () => ({
	default: {
		readFileSync: readFileSyncMock,
		promises: {
			stat: statMock,
			lstat: lstatMock,
			realpath: realpathMock,
		},
	},
}))
const yamlLoadMock = jest.fn<typeof yaml.load>()
const yamlDumpMock = jest.fn<typeof yaml.dump>()
jest.unstable_mockModule('js-yaml', () => ({
	default: {
		load: yamlLoadMock,
		dump: yamlDumpMock,
	},
}))


const {
	fileExists,
	findYAMLFilename,
	isDir,
	isFile,
	isSymbolicLink,
	readYAMLFile,
	realPathForSymbolicLink,
	requireDir,
} = await import('../../lib/file-util.js')


describe('fileExists', () => {
	it('returns true when file exists', async () => {
		statMock.mockResolvedValue({} as fs.Stats)

		expect(await fileExists('file-path')).toBe(true)

		expect(statMock).toHaveBeenCalledTimes(1)
		expect(statMock).toHaveBeenCalledWith('file-path')
	})

	it('returns false when file does not exist', async () => {
		statMock.mockRejectedValueOnce({ code: 'ENOENT' })

		expect(await fileExists('file-path')).toBe(false)

		expect(statMock).toHaveBeenCalledTimes(1)
		expect(statMock).toHaveBeenCalledWith('file-path')
	})

	it('passes on unexpected exceptions', async () => {
		statMock.mockRejectedValueOnce(Error('unexpected-error'))

		await expect(fileExists('file-path')).rejects.toThrow('unexpected-error')
		expect(statMock).toHaveBeenCalledTimes(1)
		expect(statMock).toHaveBeenCalledWith('file-path')
	})
})

describe('isFile', () => {
	it('returns false if does not exist', async () => {
		statMock.mockRejectedValueOnce({ code: 'ENOENT' })

		expect(await isFile('non-existent.stl')).toBe(false)

		expect(statMock).toHaveBeenCalledTimes(1)
		expect(statMock).toHaveBeenCalledWith('non-existent.stl')
	})

	it('returns false if exists but is not a file', async () => {
		const statsIsFileMock = jest.fn().mockReturnValue(false)
		statMock.mockResolvedValue({ isFile: statsIsFileMock } as unknown as fs.Stats)

		expect(await isFile('directory')).toBe(false)

		expect(statMock).toHaveBeenCalledTimes(2)
		expect(statMock).toHaveBeenCalledWith('directory')
		expect(statsIsFileMock).toHaveBeenCalledTimes(1)
		expect(statsIsFileMock).toHaveBeenCalledWith()
	})

	it('returns true if exists and is a file', async () => {
		const statsIsFileMock = jest.fn().mockReturnValue(true)
		statMock.mockResolvedValue({ isFile: statsIsFileMock } as unknown as fs.Stats)

		expect(await isFile('file')).toBe(true)

		expect(statMock).toHaveBeenCalledTimes(2)
		expect(statMock).toHaveBeenCalledWith('file')
		expect(statsIsFileMock).toHaveBeenCalledTimes(1)
		expect(statsIsFileMock).toHaveBeenCalledWith()
	})
})

describe('isDir', () => {
	it('returns false if does not exist', async () => {
		statMock.mockRejectedValueOnce({ code: 'ENOENT' })

		expect(await isDir('non-existent')).toBe(false)

		expect(statMock).toHaveBeenCalledTimes(1)
		expect(statMock).toHaveBeenCalledWith('non-existent')
	})

	it('returns false if exists but is not a directory', async () => {
		statMock.mockResolvedValue({} as fs.Stats)
		const statsIsDirectoryMock = jest.fn().mockReturnValue(false)
		statMock.mockResolvedValue({ isDirectory: statsIsDirectoryMock } as unknown as fs.Stats)

		expect(await isDir('file')).toBe(false)

		expect(statMock).toHaveBeenCalledTimes(2)
		expect(statMock).toHaveBeenCalledWith('file')
	})

	it('returns true if exists and is a directory', async () => {
		const statsIsDirectoryMock = jest.fn().mockReturnValue(true)
		statMock.mockResolvedValue({ isDirectory: statsIsDirectoryMock } as unknown as fs.Stats)

		expect(await isDir('directory')).toBe(true)

		expect(statMock).toHaveBeenCalledTimes(2)
		expect(statMock).toHaveBeenCalledWith('directory')
		expect(statsIsDirectoryMock).toHaveBeenCalledTimes(1)
		expect(statsIsDirectoryMock).toHaveBeenCalledWith()
	})
})

test('isSymbolicLink', async () => {
	const lstatIsSymbolicLinkMock = jest.fn<fs.Stats['isSymbolicLink']>().mockReturnValueOnce(true)
	lstatMock.mockResolvedValueOnce({ isSymbolicLink: lstatIsSymbolicLinkMock } as unknown as fs.Stats)

	expect(await isSymbolicLink('/path/to/file')).toBe(true)

	expect(lstatMock).toHaveBeenCalledTimes(1)
	expect(lstatMock).toHaveBeenCalledWith('/path/to/file')
	expect(lstatIsSymbolicLinkMock).toHaveBeenCalledTimes(1)
	expect(lstatIsSymbolicLinkMock).toHaveBeenCalledWith()
})

test('realPathForSymbolicLink', async () => {
	realpathMock.mockResolvedValueOnce('/real/file/path')

	expect(await realPathForSymbolicLink('/symbolic/link/path')).toBe('/real/file/path')

	expect(realpathMock).toHaveBeenCalledTimes(1)
	expect(realpathMock).toHaveBeenCalledWith('/symbolic/link/path')
})

describe('findYAMLFilename', () => {
	it('returns filename with yaml extension if that is found', async () => {
		const statsIsFileMock = jest.fn().mockReturnValue(true)
		statMock.mockResolvedValue({ isFile: statsIsFileMock } as unknown as fs.Stats)

		expect(await findYAMLFilename('filename')).toBe('filename.yaml')

		expect(statMock).toHaveBeenCalledTimes(2)
		expect(statMock).toHaveBeenCalledWith('filename.yaml')
		expect(statsIsFileMock).toHaveBeenCalledTimes(1)
		expect(statsIsFileMock).toHaveBeenCalledWith()
	})

	it('returns filename with yml extension if that is found', async () => {
		// mimic `isFileSpy.mockResolvedValueOnce(false)` once
		statMock.mockRejectedValueOnce({ code: 'ENOENT' })

		// mimic `isFileSpy.mockResolvedValueOnce(true)` once
		statMock.mockResolvedValueOnce({} as unknown as fs.Stats)
		const statsIsFileMock = jest.fn().mockReturnValue(true)
		statMock.mockResolvedValueOnce({ isFile: statsIsFileMock } as unknown as fs.Stats)

		expect(await findYAMLFilename('filename')).toBe('filename.yml')

		expect(statMock).toHaveBeenCalledTimes(3)
		expect(statMock).toHaveBeenCalledWith('filename.yaml')
		expect(statMock).toHaveBeenCalledWith('filename.yml')
	})

	it('returns false when no matching file found', async () => {
		statMock.mockRejectedValue({ code: 'ENOENT' })

		expect(await findYAMLFilename('filename')).toBe(false)

		expect(statMock).toHaveBeenCalledTimes(2)
		expect(statMock).toHaveBeenCalledWith('filename.yaml')
		expect(statMock).toHaveBeenCalledWith('filename.yml')
	})
})

describe('requireDir', () => {
	it('returns directory when it exists and is a directory', async () => {
		// mimic `isDirSpy.mockResolvedValue(true)`
		const statsIsDirectoryMock = jest.fn().mockReturnValue(true)
		statMock.mockResolvedValue({ isDirectory: statsIsDirectoryMock } as unknown as fs.Stats)

		expect(await requireDir('my-dir')).toBe('my-dir')

		expect(statMock).toHaveBeenCalledTimes(2)
		expect(statMock).toHaveBeenCalledWith('my-dir')
	})

	it('throws exception when directory does not exist', async () => {
		// mimic `isDirSpy.mockResolvedValue(false)`
		statMock.mockRejectedValueOnce({ code: 'ENOENT' })

		await expect(requireDir('not-a-dir')).rejects.toThrow('missing required directory: not-a-dir')

		expect(statMock).toHaveBeenCalledTimes(1)
		expect(statMock).toHaveBeenCalledWith('not-a-dir')
	})
})

describe('readYAMLFile', () => {
	it('returns processed file', () => {
		const yamlFile: YAMLFileData = { key: 'value' }
		readFileSyncMock.mockReturnValueOnce('file contents')
		yamlLoadMock.mockReturnValueOnce(yamlFile)

		expect(readYAMLFile('filename')).toBe(yamlFile)

		expect(readFileSyncMock).toHaveBeenCalledTimes(1)
		expect(readFileSyncMock).toHaveBeenCalledWith('filename', 'utf-8')
		expect(yamlLoadMock).toHaveBeenCalledTimes(1)
		expect(yamlLoadMock).toHaveBeenCalledWith('file contents')
	})

	it('passes error message into user-facing error', () => {
		readFileSyncMock.mockImplementation(() => { throw Error('read failure') })

		expect(() => readYAMLFile('filename'))
			.toThrow('error "read failure" reading filename')

		expect(readFileSyncMock).toHaveBeenCalledTimes(1)
		expect(readFileSyncMock).toHaveBeenCalledWith('filename', 'utf-8')
	})

	it.each`
		invalidYaml | errorMessage
		${{}}       | ${'error "invalid file" reading filename'}
		${null}     | ${'error "empty file" reading filename'}
		${''}       | ${'error "invalid file" reading filename'}
		${0}        | ${'error "invalid file" reading filename'}
	`('throws $errorMessage when reading $invalidYaml', ({ invalidYaml, errorMessage }) => {
		readFileSyncMock.mockReturnValueOnce('file contents')
		yamlLoadMock.mockReturnValueOnce(invalidYaml)

		expect(() => readYAMLFile('filename')).toThrow(errorMessage)
	})
})
