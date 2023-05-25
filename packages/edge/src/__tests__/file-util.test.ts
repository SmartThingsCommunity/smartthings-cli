import fs from 'fs'

import yaml from 'js-yaml'

import { fileExists, findYAMLFilename, isDir, isFile, readYAMLFile, requireDir, YAMLFileData }
	from '../lib/file-util.js'
import * as fileUtil from '../lib/file-util.js'


jest.mock('fs', () => {
	// if this isn't done, something breaks with sub-dependency 'fs-extra'
	const originalLib = jest.requireActual('fs')

	return {
		...originalLib,
		readFileSync: jest.fn(),
		promises: {
			stat: jest.fn(),
		},
	}
})
jest.mock('js-yaml')

describe('file-util', () => {
	const statMock = jest.mocked(fs.promises.stat)

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

	const fileExistsSpy = jest.spyOn(fileUtil, 'fileExists')

	describe('isFile', () => {
		it('returns false if does not exist', async () => {
			fileExistsSpy.mockResolvedValue(false)

			expect(await isFile('non-existent.stl')).toBe(false)

			expect(fileExistsSpy).toHaveBeenCalledTimes(1)
			expect(fileExistsSpy).toHaveBeenCalledWith('non-existent.stl')
			expect(statMock).toHaveBeenCalledTimes(0)
		})

		it('returns false if exists but is not a file', async () => {
			fileExistsSpy.mockResolvedValue(true)
			const statsIsFileMock = jest.fn().mockReturnValue(false)
			statMock.mockResolvedValue({ isFile: statsIsFileMock } as unknown as fs.Stats)

			expect(await isFile('directory')).toBe(false)

			expect(fileExistsSpy).toHaveBeenCalledTimes(1)
			expect(fileExistsSpy).toHaveBeenCalledWith('directory')
			expect(statMock).toHaveBeenCalledTimes(1)
			expect(statMock).toHaveBeenCalledWith('directory')
			expect(statsIsFileMock).toHaveBeenCalledTimes(1)
			expect(statsIsFileMock).toHaveBeenCalledWith()
		})

		it('returns true if exists and is a file', async () => {
			fileExistsSpy.mockResolvedValue(true)
			const statsIsFileMock = jest.fn().mockReturnValue(true)
			statMock.mockResolvedValue({ isFile: statsIsFileMock } as unknown as fs.Stats)

			expect(await isFile('file')).toBe(true)

			expect(fileExistsSpy).toHaveBeenCalledTimes(1)
			expect(fileExistsSpy).toHaveBeenCalledWith('file')
			expect(statMock).toHaveBeenCalledTimes(1)
			expect(statMock).toHaveBeenCalledWith('file')
			expect(statsIsFileMock).toHaveBeenCalledTimes(1)
			expect(statsIsFileMock).toHaveBeenCalledWith()
		})
	})

	describe('isDir', () => {
		it('returns false if does not exist', async () => {
			fileExistsSpy.mockResolvedValue(false)

			expect(await isDir('non-existent')).toBe(false)

			expect(fileExistsSpy).toHaveBeenCalledTimes(1)
			expect(fileExistsSpy).toHaveBeenCalledWith('non-existent')
			expect(statMock).toHaveBeenCalledTimes(0)
		})

		it('returns false if exists but is not a directory', async () => {
			fileExistsSpy.mockResolvedValue(true)
			const statsIsDirectoryMock = jest.fn().mockReturnValue(false)
			statMock.mockResolvedValue({ isDirectory: statsIsDirectoryMock } as unknown as fs.Stats)

			expect(await isDir('file')).toBe(false)

			expect(fileExistsSpy).toHaveBeenCalledTimes(1)
			expect(fileExistsSpy).toHaveBeenCalledWith('file')
			expect(statMock).toHaveBeenCalledTimes(1)
			expect(statMock).toHaveBeenCalledWith('file')
		})

		it('returns true if exists and is a directory', async () => {
			fileExistsSpy.mockResolvedValue(true)
			const statsIsDirectoryMock = jest.fn().mockReturnValue(true)
			statMock.mockResolvedValue({ isDirectory: statsIsDirectoryMock } as unknown as fs.Stats)

			expect(await isDir('directory')).toBe(true)

			expect(fileExistsSpy).toHaveBeenCalledTimes(1)
			expect(fileExistsSpy).toHaveBeenCalledWith('directory')
			expect(statMock).toHaveBeenCalledTimes(1)
			expect(statMock).toHaveBeenCalledWith('directory')
		})
	})

	const isFileSpy = jest.spyOn(fileUtil, 'isFile')

	describe('findYAMLFilename', () => {
		it('returns filename with yaml extension if that is found', async () => {
			isFileSpy.mockResolvedValueOnce(true)

			expect(await findYAMLFilename('filename')).toBe('filename.yaml')

			expect(isFileSpy).toBeCalledTimes(1)
			expect(isFileSpy).toBeCalledWith('filename.yaml')
		})

		it('returns filename with yml extension if that is found', async () => {
			isFileSpy.mockResolvedValueOnce(false)
			isFileSpy.mockResolvedValueOnce(true)

			expect(await findYAMLFilename('filename')).toBe('filename.yml')

			expect(isFileSpy).toBeCalledTimes(2)
			expect(isFileSpy).toBeCalledWith('filename.yaml')
			expect(isFileSpy).toBeCalledWith('filename.yml')
		})

		it('returns false when no matching file found', async () => {
			isFileSpy.mockResolvedValue(false)

			expect(await findYAMLFilename('filename')).toBe(false)

			expect(isFileSpy).toBeCalledTimes(2)
			expect(isFileSpy).toBeCalledWith('filename.yaml')
			expect(isFileSpy).toBeCalledWith('filename.yml')
		})
	})

	const isDirSpy = jest.spyOn(fileUtil, 'isDir')

	describe('requireDir', () => {
		it('returns directory when it exists and is a directory', async () => {
			isDirSpy.mockResolvedValue(true)

			expect(await requireDir('my-dir')).toBe('my-dir')

			expect(isDirSpy).toBeCalledTimes(1)
			expect(isDirSpy).toBeCalledWith('my-dir')
		})

		it('throws exception when directory does not exist', async () => {
			isDirSpy.mockResolvedValue(false)

			await expect(requireDir('not-a-dir')).rejects.toThrow('missing required directory: not-a-dir')
		})
	})

	describe('readYAMLFile', () => {
		const readFileSyncMock = jest.mocked(fs.readFileSync)
		const yamlLoadMock = jest.mocked(yaml.load)

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
})
