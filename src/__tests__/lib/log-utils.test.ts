import { jest } from '@jest/globals'

import { type readFileSync } from 'fs'

import log4js, { type Logger } from 'log4js'
import type yaml from 'js-yaml'

import type { yamlExists } from '../../lib/io-util.js'
import { fatalError } from '../../lib/util.js'


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

const fatalErrorMock = jest.fn<typeof fatalError>().mockReturnValue('never return' as never)
jest.unstable_mockModule('../../lib/util.js', () => ({
	fatalError: fatalErrorMock,
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
		expect(yamlExistsMock).toHaveBeenCalledWith('filename')
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

		expect(readFileSyncMock).toHaveBeenCalledExactlyOnceWith('filename', 'utf-8')
		expect(yamlLoadMock).toHaveBeenCalledExactlyOnceWith('file contents')
	})

	it('ends with error if config is invalid', () => {
		const invalidConfig = {
			appenders: {},
		}
		yamlExistsMock.mockReturnValueOnce(true)
		readFileSyncMock.mockReturnValueOnce('bad file contents')
		yamlLoadMock.mockReturnValueOnce(invalidConfig)

		expect(loadLog4jsConfig('filename', defaultConfig)).toBe('never return')

		expect(readFileSyncMock).toHaveBeenCalledExactlyOnceWith('filename', 'utf-8')
		expect(yamlLoadMock).toHaveBeenCalledExactlyOnceWith('bad file contents')

		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith(
			expect.stringContaining('invalid or unreadable logging config file format'),
		)
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
		expect(mockLogger.trace).toHaveBeenCalledExactlyOnceWith('trace message', 'trace arg')

		coreSDKLogger.debug('debug message', 'debug arg')
		expect(mockLogger.debug).toHaveBeenCalledExactlyOnceWith('debug message', 'debug arg')

		coreSDKLogger.info('info message', 'info arg')
		expect(mockLogger.info).toHaveBeenCalledExactlyOnceWith('info message', 'info arg')

		coreSDKLogger.warn('warn message', 'warn arg')
		expect(mockLogger.warn).toHaveBeenCalledExactlyOnceWith('warn message', 'warn arg')

		coreSDKLogger.error('error message', 'error arg')
		expect(mockLogger.error).toHaveBeenCalledExactlyOnceWith('error message', 'error arg')

		coreSDKLogger.fatal('fatal message', 'fatal arg')
		expect(mockLogger.fatal).toHaveBeenCalledExactlyOnceWith('fatal message', 'fatal arg')
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
