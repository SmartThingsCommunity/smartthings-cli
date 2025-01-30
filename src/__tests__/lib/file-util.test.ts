import { jest } from '@jest/globals'

import { readFileSync, promises as fsPromises, Stats } from 'node:fs'

import type yaml from 'js-yaml'

import { type YAMLFileData } from '../../lib/file-util.js'
import type { fatalError } from '../../lib/util.js'


const readFileSyncMock = jest.fn<typeof readFileSync>()
jest.unstable_mockModule('node:fs', () => ({
	readFileSync: readFileSyncMock,
}))

const statMock = jest.fn<typeof fsPromises.stat>()
const lstatMock = jest.fn<typeof fsPromises.lstat>()
const mkdirMock = jest.fn<typeof fsPromises.mkdir>()
const realpathMock = jest.fn<typeof fsPromises.realpath>()
jest.unstable_mockModule('node:fs/promises', () => ({
	stat: statMock,
	lstat: lstatMock,
	mkdir: mkdirMock,
	realpath: realpathMock,
}))

const yamlLoadMock = jest.fn<typeof yaml.load>()
const yamlDumpMock = jest.fn<typeof yaml.dump>()
jest.unstable_mockModule('js-yaml', () => ({
	default: {
		load: yamlLoadMock,
		dump: yamlDumpMock,
	},
}))

const fatalErrorMock = jest.fn<typeof fatalError>()
jest.unstable_mockModule('../../lib/util.js', () => ({
	fatalError: fatalErrorMock,
}))


const {
	ensureDir,
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
		statMock.mockResolvedValue({} as Stats)

		expect(await fileExists('file-path')).toBe(true)

		expect(statMock).toHaveBeenCalledExactlyOnceWith('file-path')
	})

	it('returns false when file does not exist', async () => {
		statMock.mockRejectedValueOnce({ code: 'ENOENT' })

		expect(await fileExists('file-path')).toBe(false)

		expect(statMock).toHaveBeenCalledExactlyOnceWith('file-path')
	})

	it('passes on unexpected exceptions', async () => {
		statMock.mockRejectedValueOnce(Error('unexpected-error'))

		await expect(fileExists('file-path')).rejects.toThrow('unexpected-error')
		expect(statMock).toHaveBeenCalledExactlyOnceWith('file-path')
	})
})

describe('isFile', () => {
	it('returns false if does not exist', async () => {
		statMock.mockRejectedValueOnce({ code: 'ENOENT' })

		expect(await isFile('non-existent.stl')).toBe(false)

		expect(statMock).toHaveBeenCalledExactlyOnceWith('non-existent.stl')
	})

	it('returns false if exists but is not a file', async () => {
		const statsIsFileMock = jest.fn().mockReturnValue(false)
		statMock.mockResolvedValue({ isFile: statsIsFileMock } as unknown as Stats)

		expect(await isFile('directory')).toBe(false)

		expect(statMock).toHaveBeenCalledTimes(2)
		expect(statMock).toHaveBeenCalledWith('directory')
		expect(statsIsFileMock).toHaveBeenCalledExactlyOnceWith()
	})

	it('returns true if exists and is a file', async () => {
		const statsIsFileMock = jest.fn().mockReturnValue(true)
		statMock.mockResolvedValue({ isFile: statsIsFileMock } as unknown as Stats)

		expect(await isFile('file')).toBe(true)

		expect(statMock).toHaveBeenCalledTimes(2)
		expect(statMock).toHaveBeenCalledWith('file')
		expect(statsIsFileMock).toHaveBeenCalledExactlyOnceWith()
	})
})

describe('isDir', () => {
	it('returns false if does not exist', async () => {
		statMock.mockRejectedValueOnce({ code: 'ENOENT' })

		expect(await isDir('non-existent')).toBe(false)

		expect(statMock).toHaveBeenCalledExactlyOnceWith('non-existent')
	})

	it('returns false if exists but is not a directory', async () => {
		statMock.mockResolvedValue({} as Stats)
		const statsIsDirectoryMock = jest.fn().mockReturnValue(false)
		statMock.mockResolvedValue({ isDirectory: statsIsDirectoryMock } as unknown as Stats)

		expect(await isDir('file')).toBe(false)

		expect(statMock).toHaveBeenCalledTimes(2)
		expect(statMock).toHaveBeenCalledWith('file')
	})

	it('returns true if exists and is a directory', async () => {
		const statsIsDirectoryMock = jest.fn().mockReturnValue(true)
		statMock.mockResolvedValue({ isDirectory: statsIsDirectoryMock } as unknown as Stats)

		expect(await isDir('directory')).toBe(true)

		expect(statMock).toHaveBeenCalledTimes(2)
		expect(statMock).toHaveBeenCalledWith('directory')
		expect(statsIsDirectoryMock).toHaveBeenCalledExactlyOnceWith()
	})
})

test('isSymbolicLink', async () => {
	const lstatIsSymbolicLinkMock = jest.fn<Stats['isSymbolicLink']>().mockReturnValueOnce(true)
	lstatMock.mockResolvedValueOnce({ isSymbolicLink: lstatIsSymbolicLinkMock } as unknown as Stats)

	expect(await isSymbolicLink('/path/to/file')).toBe(true)

	expect(lstatMock).toHaveBeenCalledExactlyOnceWith('/path/to/file')
	expect(lstatIsSymbolicLinkMock).toHaveBeenCalledExactlyOnceWith()
})

test('realPathForSymbolicLink', async () => {
	realpathMock.mockResolvedValueOnce('/real/file/path')

	expect(await realPathForSymbolicLink('/symbolic/link/path')).toBe('/real/file/path')

	expect(realpathMock).toHaveBeenCalledExactlyOnceWith('/symbolic/link/path')
})

describe('findYAMLFilename', () => {
	it('returns filename with yaml extension if that is found', async () => {
		const statsIsFileMock = jest.fn().mockReturnValue(true)
		statMock.mockResolvedValue({ isFile: statsIsFileMock } as unknown as Stats)

		expect(await findYAMLFilename('filename')).toBe('filename.yaml')

		expect(statMock).toHaveBeenCalledTimes(2)
		expect(statMock).toHaveBeenCalledWith('filename.yaml')
		expect(statsIsFileMock).toHaveBeenCalledExactlyOnceWith()
	})

	it('returns filename with yml extension if that is found', async () => {
		// mimic `isFileSpy.mockResolvedValueOnce(false)` once
		statMock.mockRejectedValueOnce({ code: 'ENOENT' })

		// mimic `isFileSpy.mockResolvedValueOnce(true)` once
		statMock.mockResolvedValueOnce({} as unknown as Stats)
		const statsIsFileMock = jest.fn().mockReturnValue(true)
		statMock.mockResolvedValueOnce({ isFile: statsIsFileMock } as unknown as Stats)

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
		const statsIsDirectoryMock = jest.fn().mockReturnValue(true)
		statMock.mockResolvedValue({ isDirectory: statsIsDirectoryMock } as unknown as Stats)

		expect(await requireDir('my-dir')).toBe('my-dir')

		expect(statMock).toHaveBeenCalledTimes(2)
		expect(statMock).toHaveBeenCalledWith('my-dir')
	})

	it('throws exception when directory does not exist', async () => {
		statMock.mockRejectedValueOnce({ code: 'ENOENT' })
		fatalErrorMock.mockReturnValue('never return' as never)

		expect(await requireDir('not-a-dir')).toBe('never return')

		expect(statMock).toHaveBeenCalledExactlyOnceWith('not-a-dir')
		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith('missing required directory: not-a-dir')
	})
})

describe('ensureDir', () => {
	it('completes without exception when directory already exists', async () => {
		const statsIsDirectoryMock = jest.fn().mockReturnValue(true)
		statMock.mockResolvedValue({ isDirectory: statsIsDirectoryMock } as unknown as Stats)

		await expect(ensureDir('test-dir')).resolves.not.toThrow()

		expect(statMock).toHaveBeenCalledExactlyOnceWith('test-dir')

		expect(mkdirMock).not.toHaveBeenCalled()
	})

	it('makes directory when needed', async () => {
		statMock.mockRejectedValueOnce({ code: 'ENOENT' })

		await expect(ensureDir('test-dir')).resolves.not.toThrow()

		expect(statMock).toHaveBeenCalledExactlyOnceWith('test-dir')
		expect(mkdirMock).toHaveBeenCalledExactlyOnceWith('test-dir', { recursive: true })
	})

	it('throws unexpected error from stat', async () => {
		const error = Error('unexpected error')
		statMock.mockRejectedValueOnce(error)

		await expect(ensureDir('test-dir')).rejects.toThrow(error)

		expect(statMock).toHaveBeenCalledExactlyOnceWith('test-dir')
		expect(mkdirMock).not.toHaveBeenCalled()
	})

	it('throws error if file already exists but is not a directory', async () => {
		const statsIsDirectoryMock = jest.fn().mockReturnValue(false)
		statMock.mockResolvedValue({ isDirectory: statsIsDirectoryMock } as unknown as Stats)

		await expect(ensureDir('test-dir')).rejects.toThrow('test-dir already exists but is not a directory')

		expect(statMock).toHaveBeenCalledExactlyOnceWith('test-dir')
		expect(mkdirMock).not.toHaveBeenCalled()
	})
})

describe('readYAMLFile', () => {
	it('returns processed file', () => {
		const yamlFile: YAMLFileData = { key: 'value' }
		readFileSyncMock.mockReturnValueOnce('file contents')
		yamlLoadMock.mockReturnValueOnce(yamlFile)

		expect(readYAMLFile('filename')).toBe(yamlFile)

		expect(readFileSyncMock).toHaveBeenCalledExactlyOnceWith('filename', 'utf-8')
		expect(yamlLoadMock).toHaveBeenCalledExactlyOnceWith('file contents')
	})

	it('passes error message into user-facing error', () => {
		readFileSyncMock.mockImplementation(() => { throw Error('read failure') })
		fatalErrorMock.mockReturnValueOnce('never return' as never)

		expect(readYAMLFile('filename')).toBe('never return')

		expect(readFileSyncMock).toHaveBeenCalledExactlyOnceWith('filename', 'utf-8')
		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith('error "read failure" reading filename')
	})

	it.each`
		invalidYaml | errorMessage
		${{}}       | ${'invalid file filename'}
		${null}     | ${'empty file filename'}
		${''}       | ${'invalid file filename'}
		${0}        | ${'invalid file filename'}
	`('throws $errorMessage when reading $invalidYaml', ({ invalidYaml, errorMessage }) => {
		readFileSyncMock.mockReturnValueOnce('file contents')
		yamlLoadMock.mockReturnValueOnce(invalidYaml)
		fatalErrorMock.mockReturnValueOnce('never return' as never)

		expect(readYAMLFile('filename')).toBe('never return')

		expect(fatalErrorMock).toHaveBeenCalledWith(errorMessage)
	})
})
