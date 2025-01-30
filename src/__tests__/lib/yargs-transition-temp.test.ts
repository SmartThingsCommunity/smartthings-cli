import { jest } from '@jest/globals'

import { copyFile } from 'node:fs/promises'
import type { homedir, platform, tmpdir } from 'node:os'
import type { join } from 'node:path'

import { ensureDir, isFile } from '../../lib/file-util.js'


const copyFileMock = jest.fn<typeof copyFile>()
jest.unstable_mockModule('node:fs/promises', () => ({
	copyFile: copyFileMock,
}))

const homedirMock = jest.fn<typeof homedir>().mockReturnValue('home-dir-func')
const platformMock = jest.fn<typeof platform>()
const tmpdirMock = jest.fn<typeof tmpdir>().mockReturnValue('tmp-dir-func')
jest.unstable_mockModule('node:os', () => ({
	homedir: homedirMock,
	platform: platformMock,
	tmpdir: tmpdirMock,
}))

const joinMock = jest.fn<typeof join>().mockImplementation((...paths: string[]) => paths.join('|'))
jest.unstable_mockModule('node:path', () => ({
	join: joinMock,
}))

const ensureDirMock = jest.fn<typeof ensureDir>()
const isFileMock = jest.fn<typeof isFile>()
jest.unstable_mockModule('../../lib/file-util.js', () => ({
	ensureDir: ensureDirMock,
	isFile: isFileMock,
}))

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { /*no-op*/ })
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { /*no-op*/ })


const {
	oldDirs,
	copyIfExists,
} = await import('../../lib/yargs-transition-temp.js')


const origEnv = process.env

beforeEach(() => {
	process.env = { ...origEnv }
})

afterEach(() => {
	process.env = origEnv
})

describe('oldDirs', () => {
	type MockEnvironment = {
		platform: NodeJS.Platform
		env: NodeJS.ProcessEnv
		homeDirReturnsEmpty?: boolean // defaults to true

		oldConfigDir: string
		oldCacheDir: string
	}

	/* eslint-disable @typescript-eslint/naming-convention */
	const mockEnvironments: MockEnvironment[] = [
		{
			platform: 'win32',
			env: {
				HOMEDRIVE: 'home-drive-env',
				HOMEPATH: 'home-path-env',
				USERPROFILE: 'user-profile-env',
			},
			oldConfigDir: 'home-drive-env|home-path-env|.config|@smartthings/cli',
			oldCacheDir: 'home-drive-env|home-path-env|.cache|@smartthings/cli',
		},
		{
			platform: 'win32',
			env: {
				USERPROFILE: 'user-profile-env',
			},
			oldConfigDir: 'user-profile-env|.config|@smartthings/cli',
			oldCacheDir: 'user-profile-env|.cache|@smartthings/cli',
		},
		{
			platform: 'win32',
			env: {
				HOMEDRIVE: 'home-drive-env',
				HOMEPATH: 'home-path-env',
				USERPROFILE: 'user-profile-env',
				HOME: 'home-env',
			},
			oldConfigDir: 'home-env|.config|@smartthings/cli',
			oldCacheDir: 'home-env|.cache|@smartthings/cli',
		},
		{
			platform: 'win32',
			env: {
				HOMEDRIVE: 'home-drive-env',
				HOMEPATH: 'home-path-env',
				USERPROFILE: 'user-profile-env',
				HOME: 'home-env',
				XDG_CONFIG_HOME: 'xdg-config-home-env',
				XDG_CACHE_HOME: 'xdg-cache-home-env',
			},
			oldConfigDir: 'xdg-config-home-env|@smartthings/cli',
			oldCacheDir: 'xdg-cache-home-env|@smartthings/cli',
		},
		{
			platform: 'darwin',
			env: {
				HOMEDRIVE: 'home-drive-env',
				HOMEPATH: 'home-path-env',
				USERPROFILE: 'user-profile-env',
				HOME: 'home-env',
			},
			oldConfigDir: 'home-env|.config|@smartthings/cli',
			oldCacheDir: 'home-env|Library|Caches|@smartthings/cli',
		},
		{
			platform: 'linux',
			env: {
			},
			oldConfigDir: 'home-dir-func|.config|@smartthings/cli',
			oldCacheDir: 'home-dir-func|.cache|@smartthings/cli',
		},
		{
			platform: 'linux',
			env: {
			},
			homeDirReturnsEmpty: false,
			oldConfigDir: 'tmp-dir-func|.config|@smartthings/cli',
			oldCacheDir: 'tmp-dir-func|.cache|@smartthings/cli',
		},
	]
	/* eslint-enable @typescript-eslint/naming-convention */

	it.each(mockEnvironments)('', ({ platform, env, oldConfigDir, oldCacheDir, homeDirReturnsEmpty }) => {
		platformMock.mockReturnValue(platform)
		process.env = env
		if (homeDirReturnsEmpty === false) {
			homedirMock.mockReturnValueOnce('')
		}

		expect(oldDirs()).toStrictEqual({ oldConfigDir, oldCacheDir })
	})
})

describe('copyIfExists', () => {
	it('copies with no log message when given no description', async () => {
		joinMock.mockReturnValueOnce('old-filename')
		joinMock.mockReturnValueOnce('new-filename')

		isFileMock.mockResolvedValueOnce(true)
		isFileMock.mockResolvedValueOnce(false)

		await expect(copyIfExists({
			filename: 'filename',
			oldDir: 'old-dir',
			newDir: 'new-dir',
			verboseLogging: false,
		})).resolves.not.toThrow()

		expect(joinMock).toHaveBeenCalledTimes(2)
		expect(joinMock).toHaveBeenCalledWith('old-dir', 'filename')
		expect(joinMock).toHaveBeenCalledWith('new-dir', 'filename')
		expect(isFileMock).toHaveBeenCalledTimes(2)
		expect(isFileMock).toHaveBeenCalledWith('old-filename')
		expect(isFileMock).toHaveBeenCalledWith('new-filename')
		expect(ensureDirMock).toHaveBeenCalledExactlyOnceWith('new-dir')
		expect(copyFileMock).toHaveBeenCalledExactlyOnceWith('old-filename', 'new-filename')

		expect(consoleErrorSpy).not.toHaveBeenCalledWith(expect.stringContaining('found old file old-filename'))
		expect(consoleWarnSpy).not.toHaveBeenCalledWith(expect.stringContaining('and copied it to'))
	})

	it('copies with log message when given description', async () => {
		joinMock.mockReturnValueOnce('old-filename')
		joinMock.mockReturnValueOnce('new-filename')

		isFileMock.mockResolvedValueOnce(true)
		isFileMock.mockResolvedValueOnce(false)

		await expect(copyIfExists({
			filename: 'filename',
			oldDir: 'old-dir',
			newDir: 'new-dir',
			description: 'interesting',
			verboseLogging: true,
		})).resolves.not.toThrow()

		expect(isFileMock).toHaveBeenCalledTimes(2)
		expect(isFileMock).toHaveBeenCalledWith('old-filename')
		expect(isFileMock).toHaveBeenCalledWith('new-filename')
		expect(ensureDirMock).toHaveBeenCalledExactlyOnceWith('new-dir')
		expect(copyFileMock).toHaveBeenCalledExactlyOnceWith('old-filename', 'new-filename')
		expect(consoleErrorSpy).toHaveBeenCalledWith('found old file filename in old-dir; copying to new-dir')
		expect(consoleWarnSpy).toHaveBeenCalledWith(
			'found old interesting file old-filename and copied it to new-filename\n' +
				'from version 2.0, the CLI will use new-filename for interesting')

	})

	it('does nothing if old file does not exist', async () => {
		joinMock.mockReturnValueOnce('old-filename')
		joinMock.mockReturnValueOnce('new-filename')

		isFileMock.mockResolvedValueOnce(false)
		isFileMock.mockResolvedValueOnce(false)

		await expect(copyIfExists({
			filename: 'filename',
			oldDir: 'old-dir',
			newDir: 'new-dir',
			verboseLogging: false,
		})).resolves.not.toThrow()

		expect(ensureDirMock).not.toHaveBeenCalled()
		expect(copyFileMock).not.toHaveBeenCalled()
		expect(consoleErrorSpy).not.toHaveBeenCalledWith(expect.stringContaining('found old file old-filename'))
		expect(consoleWarnSpy).not.toHaveBeenCalledWith(expect.stringContaining('and copied it to'))
	})

	it('does nothing new file already exists', async () => {
		joinMock.mockReturnValueOnce('old-filename')
		joinMock.mockReturnValueOnce('new-filename')

		isFileMock.mockResolvedValueOnce(true)
		isFileMock.mockResolvedValueOnce(true)

		await expect(copyIfExists({
			filename: 'filename',
			oldDir: 'old-dir',
			newDir: 'new-dir',
			verboseLogging: true,
		})).resolves.not.toThrow()

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			'not copying filename from old-dir to new-dir; oldExists=true; newExists=true',
		)

		expect(ensureDirMock).not.toHaveBeenCalled()
		expect(copyFileMock).not.toHaveBeenCalled()
		expect(consoleWarnSpy).not.toHaveBeenCalledWith(expect.stringContaining('and copied it to'))
	})

	it('does nothing if directory unchanged', async () => {
		await expect(copyIfExists({
			filename: 'filename',
			oldDir: 'old-dir-same-as-new',
			newDir: 'old-dir-same-as-new',
			verboseLogging: true,
		})).resolves.not.toThrow()

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			'old and new directories (old-dir-same-as-new) are the same for filename',
		)

		expect(ensureDirMock).not.toHaveBeenCalled()
		expect(copyFileMock).not.toHaveBeenCalled()
		expect(consoleWarnSpy).not.toHaveBeenCalledWith(expect.stringContaining('and copied it to'))
	})
})
