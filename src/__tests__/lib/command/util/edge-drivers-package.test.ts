import { jest } from '@jest/globals'

import type { createReadStream, Dirent, readdirSync, ReadStream } from 'node:fs'

import type JSZip from 'jszip'
import type picomatch from 'picomatch'
import type { Matcher, Result } from 'picomatch'

import type {
	fileExists,
	findYAMLFilename,
	isDir,
	isFile,
	isSymbolicLink,
	readYAMLFile,
	realPathForSymbolicLink,
	requireDir,
} from '../../../../lib/file-util.js'
import { fatalError } from '../../../../lib/util.js'


const readStreamMock = { path: '/goes/to/here' } as ReadStream
const createReadStreamMock = jest.fn<typeof createReadStream>().mockReturnValue(readStreamMock)
const readdirSyncMock = jest.fn<typeof readdirSync>()
jest.unstable_mockModule('node:fs', () => ({
	createReadStream: createReadStreamMock,
	readdirSync: readdirSyncMock,
}))

const zipFileMock = jest.fn<JSZip['file']>()
const zipMock = { file: zipFileMock } as unknown as JSZip
jest.unstable_mockModule('jszip', () => ({
	default: zipMock,
}))

const picomatchMock = jest.fn<typeof picomatch>()
jest.unstable_mockModule('picomatch', () => ({
	default: picomatchMock,
}))

const fileExistsMock = jest.fn<typeof fileExists>()
const findYAMLFilenameMock = jest.fn<typeof findYAMLFilename>()
const isDirMock = jest.fn<typeof isDir>()
const isFileMock = jest.fn<typeof isFile>()
const isSymbolicLinkMock = jest.fn<typeof isSymbolicLink>()
const readYAMLFileMock = jest.fn<typeof readYAMLFile>()
const realPathForSymbolicLinkMock = jest.fn<typeof realPathForSymbolicLink>()
const requireDirMock = jest.fn<typeof requireDir>()
jest.unstable_mockModule('../../../../lib/file-util.js', () => ({
	fileExists: fileExistsMock,
	findYAMLFilename: findYAMLFilenameMock,
	isDir: isDirMock,
	isFile: isFileMock,
	isSymbolicLink: isSymbolicLinkMock,
	readYAMLFile: readYAMLFileMock,
	realPathForSymbolicLink: realPathForSymbolicLinkMock,
	requireDir: requireDirMock,
}))

const fatalErrorMock = jest.fn<typeof fatalError>().mockReturnValue('never return' as never)
jest.unstable_mockModule('../../../../lib/util.js', () => ({
	fatalError: fatalErrorMock,
}))

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { /*no-op*/ })


const {
	buildTestFileMatchers,
	processConfigFile,
	processFingerprintsFile,
	processOptionalYAMLFile,
	processProfiles,
	processSearchParametersFile,
	processSrcDir,
	resolveProjectDirName,
} = await import('../../../../lib/command/util/edge-driver-package.js')


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

		expect(await resolveProjectDirName('my-bad-directory')).toBe('never return')

		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith('my-bad-directory must exist and be a directory')
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

		expect(await processConfigFile('my-project-dir', zipMock)).toBe('never return')

		expect(findYAMLFilenameMock).toHaveBeenCalledTimes(1)
		expect(findYAMLFilenameMock).toHaveBeenCalledWith('my-project-dir/config')
		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith('missing main config.yaml (or config.yml) file')
		expect(readYAMLFileMock).toHaveBeenCalledTimes(0)
		expect(zipFileMock).toHaveBeenCalledTimes(0)
	})
})

describe('processOptionalYAMLFile', () => {
	findYAMLFilenameMock.mockResolvedValue('yaml filename')

	it('includes fingerprint file if found', async () => {
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

	test('processFingerprintsFile', async () => {
		await processFingerprintsFile('project dir', zipMock)

		expect(findYAMLFilenameMock).toHaveBeenCalledExactlyOnceWith('project dir/fingerprints')
		expect(zipFileMock).toHaveBeenCalledWith('fingerprints.yml', readStreamMock)
	})

	test('processSearchParametersFile', async () => {
		await processSearchParametersFile('project dir', zipMock)

		expect(findYAMLFilenameMock).toHaveBeenCalledExactlyOnceWith('project dir/search-parameters')
		expect(zipFileMock).toHaveBeenCalledWith('search-parameters.yml', readStreamMock)
	})
})

test('buildTestFileMatchers converts to matchers', () => {
	const matcher1 = ((): boolean => true) as unknown as Matcher
	const matcher2 = ((): boolean => false) as unknown as Matcher

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

		expect(await processSrcDir('project dir', zipMock, [])).toBe('never return')

		expect(requireDirMock).toHaveBeenCalledTimes(1)
		expect(requireDirMock).toHaveBeenCalledWith('project dir/src')
		expect(isFileMock).toHaveBeenCalledTimes(1)
		expect(isFileMock).toHaveBeenCalledWith('src dir/init.lua')
		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith('missing required src dir/init.lua file')
	})

	it('includes files at top level', async () => {
		requireDirMock.mockResolvedValueOnce('src dir')
		isFileMock.mockResolvedValueOnce(true) // init.lua specific check
		readdirSyncMock.mockReturnValueOnce(['init.lua' as unknown as Dirent<Buffer<ArrayBufferLike>>])
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
		readdirSyncMock.mockReturnValueOnce(
			['init.lua', 'subdirectory'] as unknown as Dirent<Buffer<ArrayBufferLike>>[],
		)
		fileExistsMock.mockResolvedValueOnce(true) // init.lua
		isSymbolicLinkMock.mockResolvedValueOnce(false) // init.lua
		isDirMock.mockResolvedValueOnce(false) // init.lua is not a directory
		createReadStreamMock.mockReturnValueOnce(readStreamMock) // init.lua
		fileExistsMock.mockResolvedValueOnce(true) // subdirectory
		isSymbolicLinkMock.mockResolvedValueOnce(false) // subdirectory
		isDirMock.mockResolvedValueOnce(true) // subdirectory is a directory
		readdirSyncMock.mockReturnValueOnce(['lib.lua' as unknown as Dirent<Buffer<ArrayBufferLike>>])
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
		readdirSyncMock.mockReturnValueOnce(['file link' as unknown as Dirent<Buffer<ArrayBufferLike>>])
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
		expect(fatalErrorMock).toHaveBeenCalledTimes(0)
	})

	it('skips files that match test dir pattern', async () => {
		requireDirMock.mockResolvedValueOnce('src dir')
		isFileMock.mockResolvedValueOnce(true) // init.lua specific check

		readdirSyncMock.mockReturnValueOnce(['init.lua', 'test.lua'] as unknown as Dirent<Buffer<ArrayBufferLike>>[])
		fileExistsMock.mockResolvedValueOnce(true) // init.lua
		isSymbolicLinkMock.mockResolvedValueOnce(false) // init.lua
		isDirMock.mockResolvedValueOnce(false) // init.lua is not a directory
		fileExistsMock.mockResolvedValueOnce(true) // test.lua
		isSymbolicLinkMock.mockResolvedValueOnce(false) // test.lua
		isDirMock.mockResolvedValueOnce(false) // test.lua is not a directory

		const matcherMock = jest.fn<Matcher>()
			.mockReturnValueOnce(false as unknown as Result) // init.lua is not a test file
			.mockReturnValueOnce(true as unknown as Result) // test.lua is a test file

		expect(await processSrcDir('project dir', zipMock, [matcherMock as unknown as Matcher])).toBe(true)

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

	it('displays error if nesting is too deep', async () => {
		requireDirMock.mockResolvedValueOnce('src dir')
		isFileMock.mockResolvedValueOnce(true) // init.lua exists

		readdirSyncMock.mockReturnValueOnce(['init.lua', 'subdirectory'] as unknown as Dirent<Buffer<ArrayBufferLike>>[])
		fileExistsMock.mockResolvedValueOnce(true) // init.lua
		isSymbolicLinkMock.mockResolvedValueOnce(false) // init.lua
		isDirMock.mockResolvedValueOnce(false) // init.lua is not a directory
		fileExistsMock.mockResolvedValueOnce(true) // subdirectory
		isSymbolicLinkMock.mockResolvedValueOnce(false) // subdirectory
		isDirMock.mockResolvedValueOnce(true) // subdirectory is a directory
		// The services limit nesting to 10 but count both the main directory and the source
		// directory, so we only need to add a total of 9 directories to get one too many.
		for (let count = 1; count <= 8; count++) {
			readdirSyncMock.mockReturnValueOnce(['subdirectory' as unknown as Dirent<Buffer<ArrayBufferLike>>])
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
		expect(consoleErrorSpy).toHaveBeenCalledExactlyOnceWith(
			`drivers directory nested too deeply (at src dir${'/subdirectory'.repeat(9)}); max depth is 10`,
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
		readdirSyncMock.mockReturnValueOnce(['dir link' as unknown as Dirent<Buffer<ArrayBufferLike>>])
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
		expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
		expect(consoleErrorSpy).toHaveBeenCalledWith('sym links to directories are not allowed (src dir/dir link)')
		expect(createReadStreamMock).toHaveBeenCalledTimes(0)
		expect(zipFileMock).toHaveBeenCalledTimes(0)
	})

	it('logs error for broken sym link', async () => {
		requireDirMock.mockResolvedValueOnce('src dir')
		isFileMock.mockResolvedValueOnce(true) // init.lua specific check
		readdirSyncMock.mockReturnValueOnce(['file link' as unknown as Dirent<Buffer<ArrayBufferLike>>])
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
		expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
		expect(consoleErrorSpy).toHaveBeenCalledWith('sym link src dir/file link points to non-existent file')
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
		readdirSyncMock.mockReturnValueOnce(
			['profile1.yml', 'profile2.yml'] as unknown as Dirent<Buffer<ArrayBufferLike>>[],
		)
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
		readdirSyncMock.mockReturnValueOnce(['profile.yaml' as unknown as Dirent<Buffer<ArrayBufferLike>>])
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
		readdirSyncMock.mockReturnValueOnce(['profile.exe' as unknown as Dirent<Buffer<ArrayBufferLike>>])

		expect(await processProfiles('project dir', zipMock)).toBe('never return')

		expect(requireDirMock).toHaveBeenCalledTimes(1)
		expect(requireDirMock).toHaveBeenCalledWith('project dir/profiles')
		expect(readdirSyncMock).toHaveBeenCalledTimes(1)
		expect(readdirSyncMock).toHaveBeenCalledWith('profiles dir')
		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith(
			'invalid profile file "profiles dir/profile.exe" (must have .yaml or .yml extension)',
		)
		expect(readYAMLFileMock).toHaveBeenCalledTimes(0)
		expect(createReadStreamMock).toHaveBeenCalledTimes(0)
		expect(zipFileMock).toHaveBeenCalledTimes(0)
	})
})
