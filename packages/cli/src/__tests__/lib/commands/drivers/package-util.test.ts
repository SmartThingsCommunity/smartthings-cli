import fs from 'fs'

import { CliUx, Errors } from '@oclif/core'
import JSZip from 'jszip'
import picomatch from 'picomatch'

import {
	fileExists,
	findYAMLFilename,
	isDir,
	isFile,
	isSymbolicLink,
	readYAMLFile,
	realPathForSymbolicLink,
	requireDir,
} from '../../../../lib/file-util'
import {
	buildTestFileMatchers,
	processConfigFile,
	processFingerprintsFile,
	processOptionalYAMLFile,
	processProfiles,
	processSearchParametersFile,
	processSrcDir,
	resolveProjectDirName,
} from '../../../../lib/commands/drivers/package-util'
import * as packageUtilModule from '../../../../lib/commands/drivers/package-util'


jest.mock('fs')
jest.mock('js-yaml')
jest.mock('picomatch')
jest.mock('../../../../../src/lib/file-util')

describe('package-utils', () => {
	// For some reason jest.mocked produces the wrong type signature for readdirSyncMock
	const readdirSyncMock = fs.readdirSync as unknown as jest.Mock<string[], [string]>
	const readStreamMock: fs.ReadStream = {} as fs.ReadStream
	const createReadStreamMock = jest.mocked(fs.createReadStream)

	const isFileMock = jest.mocked(isFile)
	const isDirMock = jest.mocked(isDir)
	const findYAMLFilenameMock = jest.mocked(findYAMLFilename)
	const requireDirMock = jest.mocked(requireDir)
	const readYAMLFileMock = jest.mocked(readYAMLFile)
	const fileExistsMock = jest.mocked(fileExists)
	const isSymbolicLinkMock = jest.mocked(isSymbolicLink)
	const realPathForSymbolicLinkMock = jest.mocked(realPathForSymbolicLink)

	const zipFileMock = jest.fn()
	const zipMock = {
		file: zipFileMock,
	} as unknown as JSZip

	const errorSpy = jest.spyOn(CliUx.ux, 'error').mockImplementation()

	describe('resolveProjectDirName', () => {
		it('returns directory from arg if it exists', async () => {
			isDirMock.mockResolvedValueOnce(true)

			expect(await resolveProjectDirName('my-project-dir')).toBe('my-project-dir')

			expect(isDirMock).toHaveBeenCalledTimes(1)
			expect(isDirMock).toHaveBeenCalledWith('my-project-dir')
		})

		it('strips trailing slash', async () => {
			isDirMock.mockResolvedValueOnce(true)

			expect(await resolveProjectDirName('my-project-dir/')).toBe('my-project-dir')

			expect(isDirMock).toHaveBeenCalledTimes(1)
			expect(isDirMock).toHaveBeenCalledWith('my-project-dir')
		})

		it('throws exception if directory does not exist', async () => {
			isDirMock.mockResolvedValueOnce(false)

			await expect(resolveProjectDirName('my-bad-directory')).rejects.toThrow(Errors.CLIError)
		})
	})

	describe('processConfigFile', () => {
		it('returns parsed config yaml file data', async () => {
			findYAMLFilenameMock.mockResolvedValueOnce('config.yaml filename')
			readYAMLFileMock.mockReturnValueOnce({ yaml: 'file contents' })
			createReadStreamMock.mockReturnValueOnce(readStreamMock)

			expect(await processConfigFile('my-project-dir', zipMock))
				.toEqual({ yaml: 'file contents' })

			expect(findYAMLFilenameMock).toHaveBeenCalledTimes(1)
			expect(findYAMLFilenameMock).toHaveBeenCalledWith('my-project-dir/config')
			expect(readYAMLFileMock).toHaveBeenCalledTimes(1)
			expect(readYAMLFileMock).toHaveBeenCalledWith('config.yaml filename')
			expect(createReadStreamMock).toHaveBeenCalledTimes(1)
			expect(createReadStreamMock).toHaveBeenCalledWith('config.yaml filename')
			expect(zipFileMock).toHaveBeenCalledTimes(1)
			expect(zipFileMock).toHaveBeenCalledWith('config.yml', readStreamMock)
		})

		it('throws error when config file is missing', async () => {
			findYAMLFilenameMock.mockResolvedValueOnce(false)

			await expect(processConfigFile('my-project-dir', zipMock))
				.rejects.toThrow(new Errors.CLIError('missing main config.yaml (or config.yml) file'))

			expect(findYAMLFilenameMock).toHaveBeenCalledTimes(1)
			expect(findYAMLFilenameMock).toHaveBeenCalledWith('my-project-dir/config')
			expect(readYAMLFileMock).toHaveBeenCalledTimes(0)
			expect(zipFileMock).toHaveBeenCalledTimes(0)
		})
	})

	describe('processOptionalYAMLFile', () => {
		it('includes fingerprint file if found', async () => {
			findYAMLFilenameMock.mockResolvedValueOnce('yaml filename')
			readYAMLFileMock.mockReturnValueOnce({ yaml: 'file contents' })
			createReadStreamMock.mockReturnValueOnce(readStreamMock)

			await processOptionalYAMLFile('optional yaml file', 'project dir', zipMock)

			expect(findYAMLFilenameMock).toHaveBeenCalledTimes(1)
			expect(findYAMLFilenameMock).toHaveBeenCalledWith('project dir/optional yaml file')
			expect(readYAMLFileMock).toHaveBeenCalledTimes(1)
			expect(readYAMLFileMock).toHaveBeenCalledWith('yaml filename')
			expect(createReadStreamMock).toHaveBeenCalledTimes(1)
			expect(createReadStreamMock).toHaveBeenCalledWith('yaml filename')
			expect(zipFileMock).toHaveBeenCalledTimes(1)
			expect(zipFileMock).toHaveBeenCalledWith('optional yaml file.yml', readStreamMock)
		})

		it('skips fingerprint file if none', async () => {
			findYAMLFilenameMock.mockResolvedValueOnce(false)

			await processOptionalYAMLFile('optional yaml file', 'project dir', zipMock)

			expect(findYAMLFilenameMock).toHaveBeenCalledTimes(1)
			expect(findYAMLFilenameMock).toHaveBeenCalledWith('project dir/optional yaml file')
			expect(readYAMLFileMock).toHaveBeenCalledTimes(0)
			expect(zipFileMock).toHaveBeenCalledTimes(0)
		})
	})

	test('processFingerprintsFile calls processOptionalYAMLFile', async () => {
		const processOptionalYAMLFileSpy = jest.spyOn(packageUtilModule, 'processOptionalYAMLFile')
			.mockImplementationOnce(async () => { /* do nothing */ })

		await processFingerprintsFile('project dir', zipMock)

		expect(processOptionalYAMLFileSpy).toHaveBeenCalledTimes(1)
		expect(processOptionalYAMLFileSpy).toHaveBeenCalledWith('fingerprints', 'project dir', zipMock)
	})

	test('processSearchParametersFile calls processOptionalYAMLFile', async () => {
		const processOptionalYAMLFileSpy = jest.spyOn(packageUtilModule, 'processOptionalYAMLFile')
			.mockImplementationOnce(async () => { /* do nothing */ })

		await processSearchParametersFile('project dir', zipMock)

		expect(processOptionalYAMLFileSpy).toHaveBeenCalledTimes(1)
		expect(processOptionalYAMLFileSpy).toHaveBeenCalledWith('search-parameters', 'project dir', zipMock)
	})

	test('buildTestFileMatchers converts to matchers', () => {
		const picomatchMock = jest.mocked(picomatch)
		const matcher1 = (): boolean => true
		const matcher2 = (): boolean => false

		picomatchMock.mockReturnValueOnce(matcher1)
		picomatchMock.mockReturnValueOnce(matcher2)

		expect(buildTestFileMatchers(['1', '2'])).toEqual([matcher1, matcher2])

		expect(picomatchMock).toHaveBeenCalledTimes(2)
		expect(picomatchMock).toHaveBeenCalledWith('1')
		expect(picomatchMock).toHaveBeenCalledWith('2')
	})

	describe('processSrcDir', () => {
		createReadStreamMock.mockReturnValue(readStreamMock)

		it('throws error when there is no init.lua file', async () => {
			requireDirMock.mockResolvedValueOnce('src dir')
			isFileMock.mockResolvedValueOnce(false)

			await expect(() => processSrcDir('project dir', zipMock, []))
				.rejects.toThrow(Errors.CLIError)

			expect(requireDirMock).toHaveBeenCalledTimes(1)
			expect(requireDirMock).toHaveBeenCalledWith('project dir/src')
			expect(isFileMock).toHaveBeenCalledTimes(1)
			expect(isFileMock).toHaveBeenCalledWith('src dir/init.lua')
		})

		it('includes files at top level', async () => {
			requireDirMock.mockResolvedValueOnce('src dir')
			isFileMock.mockResolvedValueOnce(true) // init.lua specific check
			readdirSyncMock.mockReturnValueOnce(['init.lua'])
			fileExistsMock.mockResolvedValueOnce(true) // init.lua
			isSymbolicLinkMock.mockResolvedValueOnce(false)
			isDirMock.mockResolvedValueOnce(false) // init.lua is not a directory
			createReadStreamMock.mockReturnValueOnce(readStreamMock)

			expect(await processSrcDir('project dir', zipMock, [])).toBe(true)

			expect(requireDirMock).toHaveBeenCalledTimes(1)
			expect(requireDirMock).toHaveBeenCalledWith('project dir/src')
			expect(isFileMock).toHaveBeenCalledTimes(1)
			expect(isFileMock).toHaveBeenCalledWith('src dir/init.lua')
			expect(readdirSyncMock).toHaveBeenCalledTimes(1)
			expect(readdirSyncMock).toHaveBeenCalledWith('src dir')
			expect(fileExistsMock).toHaveBeenCalledTimes(1)
			expect(fileExistsMock).toHaveBeenCalledWith('src dir/init.lua')
			expect(isSymbolicLinkMock).toHaveBeenCalledTimes(1)
			expect(isSymbolicLinkMock).toHaveBeenCalledWith('src dir/init.lua')
			expect(isDirMock).toHaveBeenCalledTimes(1)
			expect(isDirMock).toHaveBeenCalledWith('src dir/init.lua')
			expect(createReadStreamMock).toHaveBeenCalledTimes(1)
			expect(createReadStreamMock).toHaveBeenCalledWith('src dir/init.lua')
			expect(zipFileMock).toHaveBeenCalledTimes(1)
			expect(zipFileMock).toHaveBeenCalledWith('src/init.lua', readStreamMock)
			expect(realPathForSymbolicLinkMock).toHaveBeenCalledTimes(0)
		})

		it('includes nested files', async () => {
			requireDirMock.mockResolvedValueOnce('src dir')
			isFileMock.mockResolvedValueOnce(true) // init.lua specific check
			readdirSyncMock.mockReturnValueOnce(['init.lua', 'subdirectory'])
			fileExistsMock.mockResolvedValueOnce(true) // init.lua
			isSymbolicLinkMock.mockResolvedValueOnce(false) // init.lua
			isDirMock.mockResolvedValueOnce(false) // init.lua is not a directory
			createReadStreamMock.mockReturnValueOnce(readStreamMock) // init.lua
			fileExistsMock.mockResolvedValueOnce(true) // subdirectory
			isSymbolicLinkMock.mockResolvedValueOnce(false) // subdirectory
			isDirMock.mockResolvedValueOnce(true) // subdirectory is a directory
			readdirSyncMock.mockReturnValueOnce(['lib.lua'])
			fileExistsMock.mockResolvedValueOnce(true) // lib.lua
			isDirMock.mockResolvedValueOnce(false) // lib.lua
			createReadStreamMock.mockReturnValueOnce(readStreamMock) // lib.lua

			expect(await processSrcDir('project dir', zipMock, [])).toBe(true)

			expect(requireDirMock).toHaveBeenCalledTimes(1)
			expect(requireDirMock).toHaveBeenCalledWith('project dir/src')
			expect(isFileMock).toHaveBeenCalledTimes(1)
			expect(isFileMock).toHaveBeenCalledWith('src dir/init.lua')
			expect(readdirSyncMock).toHaveBeenCalledTimes(2)
			expect(readdirSyncMock).toHaveBeenCalledWith('src dir')
			expect(readdirSyncMock).toHaveBeenCalledWith('src dir/subdirectory')
			expect(isDirMock).toHaveBeenCalledTimes(3)
			expect(isDirMock).toHaveBeenCalledWith('src dir/init.lua')
			expect(isDirMock).toHaveBeenCalledWith('src dir/subdirectory')
			expect(isDirMock).toHaveBeenCalledWith('src dir/subdirectory/lib.lua')
			expect(createReadStreamMock).toHaveBeenCalledTimes(2)
			expect(createReadStreamMock).toHaveBeenCalledWith('src dir/init.lua')
			expect(createReadStreamMock).toHaveBeenCalledWith('src dir/subdirectory/lib.lua')
			expect(zipFileMock).toHaveBeenCalledTimes(2)
			expect(zipFileMock).toHaveBeenCalledWith('src/init.lua', readStreamMock)
			expect(zipFileMock).toHaveBeenCalledWith('src/subdirectory/lib.lua', readStreamMock)
			expect(realPathForSymbolicLinkMock).toHaveBeenCalledTimes(0)
		})

		it('follows sym links to files', async () => {
			requireDirMock.mockResolvedValueOnce('src dir')
			isFileMock.mockResolvedValueOnce(true) // init.lua specific check
			readdirSyncMock.mockReturnValueOnce(['file link'])
			fileExistsMock.mockResolvedValueOnce(true)
			isSymbolicLinkMock.mockResolvedValueOnce(true)
			realPathForSymbolicLinkMock.mockResolvedValueOnce('real file')
			isDirMock.mockResolvedValueOnce(false)

			expect(await processSrcDir('project dir', zipMock, [])).toBe(true)

			expect(requireDirMock).toHaveBeenCalledTimes(1)
			expect(requireDirMock).toHaveBeenCalledWith('project dir/src')
			expect(isFileMock).toHaveBeenCalledTimes(1)
			expect(isFileMock).toHaveBeenCalledWith('src dir/init.lua')
			expect(readdirSyncMock).toHaveBeenCalledTimes(1)
			expect(readdirSyncMock).toHaveBeenCalledWith('src dir')
			expect(fileExistsMock).toHaveBeenCalledTimes(1)
			expect(fileExistsMock).toHaveBeenCalledWith('src dir/file link')
			expect(isSymbolicLinkMock).toHaveBeenCalledTimes(1)
			expect(isSymbolicLinkMock).toHaveBeenCalledWith('src dir/file link')
			expect(realPathForSymbolicLinkMock).toHaveBeenCalledTimes(1)
			expect(realPathForSymbolicLinkMock).toHaveBeenCalledWith('src dir/file link')
			expect(isDirMock).toHaveBeenCalledTimes(1)
			expect(isDirMock).toHaveBeenCalledWith('real file')
			expect(createReadStreamMock).toHaveBeenCalledTimes(1)
			expect(createReadStreamMock).toHaveBeenCalledWith('src dir/file link')
			expect(zipFileMock).toHaveBeenCalledTimes(1)
			expect(zipFileMock).toHaveBeenCalledWith('src/file link', readStreamMock)
			expect(errorSpy).toHaveBeenCalledTimes(0)
		})

		it('skips files that match test dir pattern', async () => {
			requireDirMock.mockResolvedValueOnce('src dir')
			isFileMock.mockResolvedValueOnce(true) // init.lua specific check

			readdirSyncMock.mockReturnValueOnce(['init.lua', 'test.lua'])
			fileExistsMock.mockResolvedValueOnce(true) // init.lua
			isSymbolicLinkMock.mockResolvedValueOnce(false) // init.lua
			isDirMock.mockResolvedValueOnce(false) // init.lua is not a directory
			fileExistsMock.mockResolvedValueOnce(true) // test.lua
			isSymbolicLinkMock.mockResolvedValueOnce(false) // test.lua
			isDirMock.mockResolvedValueOnce(false) // test.lua is not a directory

			const matcher = jest.fn()
				.mockReturnValueOnce(false) // init.lua is not a test file
				.mockReturnValueOnce(true) // test.lua is a test file

			expect(await processSrcDir('project dir', zipMock, [matcher])).toBe(true)

			expect(requireDirMock).toHaveBeenCalledTimes(1)
			expect(requireDirMock).toHaveBeenCalledWith('project dir/src')
			expect(isFileMock).toHaveBeenCalledTimes(1)
			expect(isFileMock).toHaveBeenCalledWith('src dir/init.lua')
			expect(readdirSyncMock).toHaveBeenCalledTimes(1)
			expect(readdirSyncMock).toHaveBeenCalledWith('src dir')
			expect(isDirMock).toHaveBeenCalledTimes(2)
			expect(isDirMock).toHaveBeenCalledWith('src dir/init.lua')
			expect(isDirMock).toHaveBeenCalledWith('src dir/test.lua')
			expect(createReadStreamMock).toHaveBeenCalledTimes(1)
			expect(createReadStreamMock).toHaveBeenCalledWith('src dir/init.lua')
			expect(zipFileMock).toHaveBeenCalledTimes(1) // NOT 2! :-)
			expect(zipFileMock).toHaveBeenCalledWith('src/init.lua', readStreamMock)
			expect(realPathForSymbolicLinkMock).toHaveBeenCalledTimes(0)
		})

		it('throws error if nesting is too deep', async () => {
			requireDirMock.mockResolvedValueOnce('src dir')
			isFileMock.mockResolvedValueOnce(true) // init.lua exists

			readdirSyncMock.mockReturnValueOnce(['init.lua', 'subdirectory'])
			fileExistsMock.mockResolvedValueOnce(true) // init.lua
			isSymbolicLinkMock.mockResolvedValueOnce(false) // init.lua
			isDirMock.mockResolvedValueOnce(false) // init.lua is not a directory
			fileExistsMock.mockResolvedValueOnce(true) // subdirectory
			isSymbolicLinkMock.mockResolvedValueOnce(false) // subdirectory
			isDirMock.mockResolvedValueOnce(true) // subdirectory is a directory
			// The services limit nesting to 10 but count both the main directory and the source
			// directory, so we only need to add a total of 9 directories to get one too many.
			for (let count = 1; count <= 8; count++) {
				readdirSyncMock.mockReturnValueOnce(['subdirectory'])
				fileExistsMock.mockResolvedValueOnce(true) // subdirectory
				isSymbolicLinkMock.mockResolvedValueOnce(false) // subdirectory
				isDirMock.mockResolvedValueOnce(true)
			}

			expect(await processSrcDir('project dir', zipMock, [])).toBe(false)

			expect(requireDirMock).toHaveBeenCalledTimes(1)
			expect(requireDirMock).toHaveBeenCalledWith('project dir/src')
			expect(isFileMock).toHaveBeenCalledTimes(1)
			expect(isFileMock).toHaveBeenCalledWith('src dir/init.lua')
			expect(readdirSyncMock).toHaveBeenCalledTimes(9)
			expect(isDirMock).toHaveBeenCalledTimes(10)
			expect(isDirMock).toHaveBeenCalledWith('src dir/init.lua')
			for (let count = 0; count <= 8; count++) {
				expect(readdirSyncMock).toHaveBeenCalledWith(`src dir${'/subdirectory'.repeat(count)}`)
				expect(isDirMock).toHaveBeenCalledWith(`src dir${'/subdirectory'.repeat(count + 1)}`)
			}
			expect(errorSpy).toHaveBeenCalledTimes(1)
			expect(errorSpy).toHaveBeenCalledWith(
				`drivers directory nested too deeply (at src dir${'/subdirectory'.repeat(9)}); max depth is 10`,
				{ 'exit': false },
			)
			expect(createReadStreamMock).toHaveBeenCalledTimes(1)
			expect(createReadStreamMock).toHaveBeenCalledWith('src dir/init.lua')
			expect(zipFileMock).toHaveBeenCalledTimes(1)
			expect(zipFileMock).toHaveBeenCalledWith('src/init.lua', readStreamMock)
			expect(realPathForSymbolicLinkMock).toHaveBeenCalledTimes(0)
		})

		it('logs error for sym link to directory', async () => {
			requireDirMock.mockResolvedValueOnce('src dir')
			isFileMock.mockResolvedValueOnce(true) // init.lua specific check
			readdirSyncMock.mockReturnValueOnce(['dir link'])
			fileExistsMock.mockResolvedValueOnce(true)
			isSymbolicLinkMock.mockResolvedValueOnce(true)
			realPathForSymbolicLinkMock.mockResolvedValueOnce('real dir')
			isDirMock.mockResolvedValueOnce(true)

			expect(await processSrcDir('project dir', zipMock, [])).toBe(false)

			expect(requireDirMock).toHaveBeenCalledTimes(1)
			expect(requireDirMock).toHaveBeenCalledWith('project dir/src')
			expect(isFileMock).toHaveBeenCalledTimes(1)
			expect(isFileMock).toHaveBeenCalledWith('src dir/init.lua')
			expect(readdirSyncMock).toHaveBeenCalledTimes(1)
			expect(readdirSyncMock).toHaveBeenCalledWith('src dir')
			expect(fileExistsMock).toHaveBeenCalledTimes(1)
			expect(fileExistsMock).toHaveBeenCalledWith('src dir/dir link')
			expect(isSymbolicLinkMock).toHaveBeenCalledTimes(1)
			expect(isSymbolicLinkMock).toHaveBeenCalledWith('src dir/dir link')
			expect(realPathForSymbolicLinkMock).toHaveBeenCalledTimes(1)
			expect(realPathForSymbolicLinkMock).toHaveBeenCalledWith('src dir/dir link')
			expect(isDirMock).toHaveBeenCalledTimes(1)
			expect(isDirMock).toHaveBeenCalledWith('real dir')
			expect(errorSpy).toHaveBeenCalledTimes(1)
			expect(errorSpy).toHaveBeenCalledWith(
				'sym links to directories are not allowed (src dir/dir link)',
				{ 'exit': false },
			)
			expect(createReadStreamMock).toHaveBeenCalledTimes(0)
			expect(zipFileMock).toHaveBeenCalledTimes(0)
		})

		it('logs error for broken sym link', async () => {
			requireDirMock.mockResolvedValueOnce('src dir')
			isFileMock.mockResolvedValueOnce(true) // init.lua specific check
			readdirSyncMock.mockReturnValueOnce(['file link'])
			fileExistsMock.mockResolvedValueOnce(false)

			expect(await processSrcDir('project dir', zipMock, [])).toBe(false)

			expect(requireDirMock).toHaveBeenCalledTimes(1)
			expect(requireDirMock).toHaveBeenCalledWith('project dir/src')
			expect(isFileMock).toHaveBeenCalledTimes(1)
			expect(isFileMock).toHaveBeenCalledWith('src dir/init.lua')
			expect(readdirSyncMock).toHaveBeenCalledTimes(1)
			expect(readdirSyncMock).toHaveBeenCalledWith('src dir')
			expect(fileExistsMock).toHaveBeenCalledTimes(1)
			expect(fileExistsMock).toHaveBeenCalledWith('src dir/file link')
			expect(isSymbolicLinkMock).toHaveBeenCalledTimes(0)
			expect(realPathForSymbolicLinkMock).toHaveBeenCalledTimes(0)
			expect(isDirMock).toHaveBeenCalledTimes(0)
			expect(errorSpy).toHaveBeenCalledTimes(1)
			expect(errorSpy).toHaveBeenCalledWith(
				'sym link src dir/file link points to non-existent file',
				{ 'exit': false },
			)
			expect(createReadStreamMock).toHaveBeenCalledTimes(0)
			expect(zipFileMock).toHaveBeenCalledTimes(0)
		})
	})

	describe('processProfiles', () => {
		readYAMLFileMock.mockReturnValue({})

		it('adds nothing with no profiles', async () => {
			requireDirMock.mockResolvedValueOnce('profiles dir')
			readdirSyncMock.mockReturnValueOnce([])

			await expect(processProfiles('project dir', zipMock)).resolves.not.toThrow()

			expect(requireDirMock).toHaveBeenCalledTimes(1)
			expect(requireDirMock).toHaveBeenCalledWith('project dir/profiles')
			expect(readdirSyncMock).toHaveBeenCalledTimes(1)
			expect(readdirSyncMock).toHaveBeenCalledWith('profiles dir')
			expect(readYAMLFileMock).toHaveBeenCalledTimes(0)
			expect(createReadStreamMock).toHaveBeenCalledTimes(0)
			expect(zipFileMock).toHaveBeenCalledTimes(0)
		})

		it('adds yaml files with .yml extension', async () => {
			requireDirMock.mockResolvedValueOnce('profiles dir')
			readdirSyncMock.mockReturnValueOnce(['profile1.yml', 'profile2.yml'])
			createReadStreamMock.mockReturnValueOnce(readStreamMock)

			await expect(processProfiles('project dir', zipMock)).resolves.not.toThrow()

			expect(requireDirMock).toHaveBeenCalledTimes(1)
			expect(requireDirMock).toHaveBeenCalledWith('project dir/profiles')
			expect(readdirSyncMock).toHaveBeenCalledTimes(1)
			expect(readdirSyncMock).toHaveBeenCalledWith('profiles dir')
			expect(readYAMLFileMock).toHaveBeenCalledTimes(2)
			expect(readYAMLFileMock).toHaveBeenCalledWith('profiles dir/profile1.yml')
			expect(readYAMLFileMock).toHaveBeenCalledWith('profiles dir/profile2.yml')
			expect(createReadStreamMock).toHaveBeenCalledTimes(2)
			expect(createReadStreamMock).toHaveBeenCalledWith('profiles dir/profile1.yml')
			expect(createReadStreamMock).toHaveBeenCalledWith('profiles dir/profile2.yml')
			expect(zipFileMock).toHaveBeenCalledTimes(2)
			expect(zipFileMock).toHaveBeenCalledWith('profiles/profile1.yml', readStreamMock)
			expect(zipFileMock).toHaveBeenCalledWith('profiles/profile2.yml', readStreamMock)
		})

		it('adds yaml files with .yaml extension as .yml', async () => {
			requireDirMock.mockResolvedValueOnce('profiles dir')
			readdirSyncMock.mockReturnValueOnce(['profile.yaml'])
			createReadStreamMock.mockReturnValueOnce(readStreamMock)

			await expect(processProfiles('project dir', zipMock)).resolves.not.toThrow()

			expect(requireDirMock).toHaveBeenCalledTimes(1)
			expect(requireDirMock).toHaveBeenCalledWith('project dir/profiles')
			expect(readdirSyncMock).toHaveBeenCalledTimes(1)
			expect(readdirSyncMock).toHaveBeenCalledWith('profiles dir')
			expect(readYAMLFileMock).toHaveBeenCalledTimes(1)
			expect(readYAMLFileMock).toHaveBeenCalledWith('profiles dir/profile.yaml')
			expect(createReadStreamMock).toHaveBeenCalledTimes(1)
			expect(createReadStreamMock).toHaveBeenCalledWith('profiles dir/profile.yaml')
			expect(zipFileMock).toHaveBeenCalledTimes(1)
			expect(zipFileMock).toHaveBeenCalledWith('profiles/profile.yml', readStreamMock)
		})

		it('throws exception for non-yaml files in profiles directory', async () => {
			requireDirMock.mockResolvedValueOnce('profiles dir')
			readdirSyncMock.mockReturnValueOnce(['profile.exe'])

			await expect(processProfiles('project dir', zipMock))
				.rejects
				.toThrow(new Errors.CLIError('invalid profile file "profiles dir/profile.exe" (must have .yaml or .yml extension)'))

			expect(requireDirMock).toHaveBeenCalledTimes(1)
			expect(requireDirMock).toHaveBeenCalledWith('project dir/profiles')
			expect(readdirSyncMock).toHaveBeenCalledTimes(1)
			expect(readdirSyncMock).toHaveBeenCalledWith('profiles dir')
			expect(readYAMLFileMock).toHaveBeenCalledTimes(0)
			expect(createReadStreamMock).toHaveBeenCalledTimes(0)
			expect(zipFileMock).toHaveBeenCalledTimes(0)
		})
	})
})
