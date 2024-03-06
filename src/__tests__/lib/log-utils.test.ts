import { jest } from '@jest/globals'

import { readFileSync } from 'fs'

import log4js, { Logger } from 'log4js'
import yaml from 'js-yaml'

import { yamlExists } from '../../lib/io-util.js'


const readFileSyncMock = jest.fn<typeof readFileSync>()
jest.unstable_mockModule('fs', () => ({
	default: {
		readFileSync: readFileSyncMock,
	},
}))

const yamlLoadMock = jest.fn<typeof yaml.load>()
jest.unstable_mockModule('js-yaml', () => ({
	default: {
		load: yamlLoadMock,
	},
}))

const yamlExistsMock = jest.fn<typeof yamlExists>()
jest.unstable_mockModule('../../lib/io-util.js', () => ({
	yamlExists: yamlExistsMock,
}))


const { buildDefaultLog4jsConfig, coreSDKLoggerFromLog4JSLogger, loadLog4jsConfig } =
	await import('../../lib/log-utils.js')


describe('buildDefaultLog4jsConfig', () => {
	it('returns "default" category configured at warn level with file appender', () => {
		expect(buildDefaultLog4jsConfig('filename')).toStrictEqual({
			appenders: {
				smartthings: expect.objectContaining({
					type: 'file',
					filename: 'filename',
					maxLogSize: 1_000_000,
					backups: 1,
					keepFileExt: true,
				}),
			},
			categories: {
				default: { appenders: ['smartthings'], level: 'warn' },
			},
		})
	})

	it('lowers "default" category level to debug and adds stderr appender when debug env variable is set', () => {
		process.env.SMARTTHINGS_DEBUG = 'true'

		expect(buildDefaultLog4jsConfig('filename')).toStrictEqual({
			appenders: {
				smartthings: expect.objectContaining({
					type: 'file',
					filename: 'filename',
					maxLogSize: 1_000_000,
					backups: 1,
					keepFileExt: true,
				}),
				debug: expect.objectContaining({ type: 'stderr' }),
			},
			categories: {
				default: { appenders: ['smartthings', 'debug'], level: 'debug' },
			},
		})
	})
})

describe('loadLog4jsConfig', () => {
	const defaultConfig: log4js.Configuration = {
		appenders: {},
		categories: {},
	}
	it('returns default config if requested file is not found', () => {
		yamlExistsMock.mockReturnValueOnce(false)

		expect(loadLog4jsConfig('filename', defaultConfig)).toStrictEqual(defaultConfig)
		expect(yamlExistsMock).toBeCalledWith('filename')
	})

	it('returns valid config if found', () => {
		const loadedConfig: log4js.Configuration = {
			appenders: { appender: { type: '' } },
			categories: {},
		}
		readFileSyncMock.mockReturnValueOnce('file contents')
		yamlLoadMock.mockReturnValueOnce(loadedConfig)
		yamlExistsMock.mockReturnValueOnce(true)

		expect(loadLog4jsConfig('filename', defaultConfig)).toStrictEqual(loadedConfig)

		expect(readFileSyncMock).toHaveBeenCalledTimes(1)
		expect(readFileSyncMock).toHaveBeenCalledWith('filename', 'utf-8')
		expect(yamlLoadMock).toHaveBeenCalledTimes(1)
		expect(yamlLoadMock).toHaveBeenCalledWith('file contents')
	})

	it('throws error if config is invalid', () => {
		const invalidConfig = {
			appenders: {},
		}
		yamlExistsMock.mockReturnValueOnce(true)
		readFileSyncMock.mockReturnValueOnce('bad file contents')
		yamlLoadMock.mockReturnValueOnce(invalidConfig)

		expect(() => loadLog4jsConfig('filename', defaultConfig)).toThrow('invalid or unreadable logging config file format')

		expect(readFileSyncMock).toHaveBeenCalledTimes(1)
		expect(yamlLoadMock).toHaveBeenCalledTimes(1)
		expect(yamlLoadMock).toHaveBeenCalledWith('bad file contents')
	})
})

describe('coreSDKLoggerFromLog4JSLogger', () => {
	const mockLogger = {
		trace: jest.fn(),
		debug: jest.fn(),
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
		fatal: jest.fn(),

		isTraceEnabled: jest.fn().mockReturnValue(true),
		isDebugEnabled: jest.fn().mockReturnValue(false),
		isInfoEnabled: jest.fn().mockReturnValue(true),
		isWarnEnabled: jest.fn().mockReturnValue(false),
		isErrorEnabled: jest.fn().mockReturnValue(true),
		isFatalEnabled: jest.fn().mockReturnValue(false),
	} as unknown as Logger

	const coreSDKLogger = coreSDKLoggerFromLog4JSLogger(mockLogger)

	test('getting levels works with both kinds of log4js level', () => {
		mockLogger.level = 'level-string'
		expect(coreSDKLogger.level).toBe('level-string')

		mockLogger.level = 'INFO'
		expect(coreSDKLogger.level).toBe('INFO')
	})

	test('setting the level sets the level on the proxy', () => {
		coreSDKLogger.level = 'the level set'
		expect(mockLogger.level).toBe('the level set')
	})

	it('provides proxies for logging methods', () => {
		coreSDKLogger.trace('trace message', 'trace arg')
		expect(mockLogger.trace).toHaveBeenCalledTimes(1)
		expect(mockLogger.trace).toHaveBeenCalledWith('trace message', 'trace arg')

		coreSDKLogger.debug('debug message', 'debug arg')
		expect(mockLogger.debug).toHaveBeenCalledTimes(1)
		expect(mockLogger.debug).toHaveBeenCalledWith('debug message', 'debug arg')

		coreSDKLogger.info('info message', 'info arg')
		expect(mockLogger.info).toHaveBeenCalledTimes(1)
		expect(mockLogger.info).toHaveBeenCalledWith('info message', 'info arg')

		coreSDKLogger.warn('warn message', 'warn arg')
		expect(mockLogger.warn).toHaveBeenCalledTimes(1)
		expect(mockLogger.warn).toHaveBeenCalledWith('warn message', 'warn arg')

		coreSDKLogger.error('error message', 'error arg')
		expect(mockLogger.error).toHaveBeenCalledTimes(1)
		expect(mockLogger.error).toHaveBeenCalledWith('error message', 'error arg')

		coreSDKLogger.fatal('fatal message', 'fatal arg')
		expect(mockLogger.fatal).toHaveBeenCalledTimes(1)
		expect(mockLogger.fatal).toHaveBeenCalledWith('fatal message', 'fatal arg')
	})

	it('provides proxies for is<method>Enabled methods', () => {
		expect(coreSDKLogger.isTraceEnabled()).toBe(true)
		expect(mockLogger.isTraceEnabled).toHaveBeenCalledTimes(1)

		expect(coreSDKLogger.isDebugEnabled()).toBe(false)
		expect(mockLogger.isDebugEnabled).toHaveBeenCalledTimes(1)

		expect(coreSDKLogger.isInfoEnabled()).toBe(true)
		expect(mockLogger.isInfoEnabled).toHaveBeenCalledTimes(1)

		expect(coreSDKLogger.isWarnEnabled()).toBe(false)
		expect(mockLogger.isWarnEnabled).toHaveBeenCalledTimes(1)

		expect(coreSDKLogger.isErrorEnabled()).toBe(true)
		expect(mockLogger.isErrorEnabled).toHaveBeenCalledTimes(1)

		expect(coreSDKLogger.isFatalEnabled()).toBe(false)
		expect(mockLogger.isFatalEnabled).toHaveBeenCalledTimes(1)
	})
})
