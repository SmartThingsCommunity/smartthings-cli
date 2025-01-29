import { jest } from '@jest/globals'

import type envPaths from 'env-paths'
import type { Paths } from 'env-paths'
import type log4js from 'log4js'

import type { CLIConfig, loadConfig } from '../../../lib/cli-config.js'
import type { ensureDir } from '../../../lib/file-util.js'
import type { buildDefaultLog4jsConfig, loadLog4jsConfig } from '../../../lib/log-utils.js'
import type { SmartThingsCommandFlags } from '../../../lib/command/smartthings-command.js'
import { defaultTableGenerator } from '../../../lib/table-generator.js'
import { copyIfExists, oldDirs } from '../../../lib/yargs-transition-temp.js'
import { buildArgvMock } from '../../test-lib/builder-mock.js'


const envPathsMock = jest.fn<typeof envPaths>()
	.mockReturnValue({
		config: 'test-config-dir',
		data: 'test-data-dir',
		log: 'test-log-dir',
	} as Paths)
jest.unstable_mockModule('env-paths', () => ({
	default: envPathsMock,
}))

const { configureMock, getLoggerMock, loggerMock } = await import('../../test-lib/logger-mock.js')

const loadConfigMock = jest.fn<typeof loadConfig>()
jest.unstable_mockModule('../../../lib/cli-config.js', () => ({
	loadConfig: loadConfigMock,
}))

const ensureDirMock = jest.fn<typeof ensureDir>()
jest.unstable_mockModule('../../../lib/file-util.js', () => ({
	ensureDir: ensureDirMock,
}))

const buildDefaultLog4jsConfigMock = jest.fn<typeof buildDefaultLog4jsConfig>()
const loadLog4jsConfigMock = jest.fn<typeof loadLog4jsConfig>()
jest.unstable_mockModule('../../../lib/log-utils.js', () => ({
	buildDefaultLog4jsConfig: buildDefaultLog4jsConfigMock,
	loadLog4jsConfig: loadLog4jsConfigMock,
}))

const defaultTableGeneratorMock = jest.fn<typeof defaultTableGenerator>()
jest.unstable_mockModule('../../../lib//table-generator', () => ({
	defaultTableGenerator: defaultTableGeneratorMock,
}))

const copyIfExistsMock = jest.fn<typeof copyIfExists>()
const oldDirsMock = jest.fn<typeof oldDirs>().mockReturnValue({
	oldConfigDir: 'old-config-dir',
	oldCacheDir: 'old-cache-dir',
})
jest.unstable_mockModule('../../../lib/yargs-transition-temp.js', () => ({
	copyIfExists: copyIfExistsMock,
	oldDirs: oldDirsMock,
}))

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { /* do nothing */ })


const {
	getConfigDirsCheckingForOldConfig,
	smartThingsCommandBuilder,
	smartThingsCommand,
} = await import('../../../lib/command/smartthings-command.js')


test('smartThingsCommandBuilder', () => {
	const { envMock, optionMock, argvMock } = buildArgvMock<object, SmartThingsCommandFlags>()

	expect(smartThingsCommandBuilder(argvMock)).toBe(argvMock)

	expect(envMock).toHaveBeenCalledTimes(1)
	expect(optionMock).toHaveBeenCalledTimes(2)
})

test('getConfigDirsCheckingForOld', async () => {
	await expect(getConfigDirsCheckingForOldConfig({ verboseLogging: true })).resolves.not.toThrow()

	expect(consoleErrorSpy).toHaveBeenCalledWith('old config dir = old-config-dir')
	expect(consoleErrorSpy).toHaveBeenCalledWith('old cache dir = old-cache-dir')
	expect(consoleErrorSpy).toHaveBeenCalledWith('config dir = test-config-dir')
	expect(consoleErrorSpy).toHaveBeenCalledWith('data dir = test-data-dir')
	expect(consoleErrorSpy).toHaveBeenCalledWith('log dir = test-log-dir')
})

describe('smartThingsCommand', () => {
	const defaultLogConfig = { config: 'default' } as unknown as log4js.Configuration
	buildDefaultLog4jsConfigMock.mockReturnValue(defaultLogConfig)
	const logConfig = { config: 'final' } as unknown as log4js.Configuration
	loadLog4jsConfigMock.mockReturnValue(logConfig)
	const booleanConfigValueMock = jest.fn<CLIConfig['booleanConfigValue']>()
		.mockReturnValue(true)
	const cliConfig = {
		profile: {},
		booleanConfigValue: booleanConfigValueMock,
	} as unknown as CLIConfig
	loadConfigMock.mockResolvedValue(cliConfig)

	// TODO: write more complete tests here!
	it('works', async () => {
		const flags = { profile: 'default' }
		const result = await smartThingsCommand(flags)

		expect(result.flags).toBe(flags)

		expect(buildDefaultLog4jsConfigMock).toHaveBeenCalledTimes(1)
		expect(buildDefaultLog4jsConfigMock).toHaveBeenCalledWith(expect.stringMatching('/smartthings.log'))
		expect(loadLog4jsConfigMock).toHaveBeenCalledTimes(1)
		expect(loadLog4jsConfigMock).toHaveBeenCalledWith(expect.stringContaining('/logging.yaml'), defaultLogConfig)
		expect(configureMock).toHaveBeenCalledTimes(1)
		expect(configureMock).toHaveBeenCalledWith(logConfig)
		expect(getLoggerMock).toHaveBeenCalledTimes(1)
		expect(getLoggerMock).toHaveBeenCalledWith('cli')
		expect(loadConfigMock).toHaveBeenCalledTimes(1)
		expect(loadConfigMock).toHaveBeenCalledWith({
			configFilename: expect.stringContaining('test-config-dir/config.yaml'),
			managedConfigFilename: expect.stringContaining('test-data-dir/config-managed.yaml'),
			profileName: 'default',
		}, loggerMock)
		expect(defaultTableGeneratorMock).toHaveBeenCalledTimes(1)
		expect(defaultTableGeneratorMock).toHaveBeenCalledWith({ groupRows: true })
	})
})
