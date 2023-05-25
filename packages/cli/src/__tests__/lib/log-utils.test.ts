import { buildDefaultLog4jsConfig, loadLog4jsConfig } from '../../lib/log-utils.js'
import log4js from 'log4js'
import yaml from 'js-yaml'

import { yamlExists } from '@smartthings/cli-lib'


jest.mock('fs', () => {
	// if this isn't done, something breaks with sub-dependency 'fs-extra'
	const originalLib = jest.requireActual('fs')

	return {
		...originalLib,
		readFileSync: jest.fn(),
	}
})
jest.mock('js-yaml')

jest.mock('@smartthings/cli-lib')

describe('log-utils', () => {
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

	describe('loadLog4jsConfig', () => {
		const defaultConfig: log4js.Configuration = {
			appenders: {},
			categories: {},
		}
		const mockYamlExists = jest.mocked(yamlExists)
		const mockLoad = jest.mocked(yaml.load)

		it('returns default config if requested file is not found', () => {
			mockYamlExists.mockReturnValueOnce(false)

			expect(loadLog4jsConfig('filename', defaultConfig)).toStrictEqual(defaultConfig)
			expect(mockYamlExists).toBeCalledWith('filename')
		})

		it('returns valid config if found', () => {
			const loadedConfig: log4js.Configuration = {
				appenders: { appender: { type: '' } },
				categories: {},
			}
			mockLoad.mockReturnValueOnce(loadedConfig)
			mockYamlExists.mockReturnValueOnce(true)

			expect(loadLog4jsConfig('filename', defaultConfig)).toStrictEqual(loadedConfig)
		})

		it('throws error if config is invalid', () => {
			const invalidConfig = {
				appenders: {},
			}
			mockLoad.mockReturnValueOnce(invalidConfig)
			mockYamlExists.mockReturnValueOnce(true)

			expect(() => loadLog4jsConfig('filename', defaultConfig)).toThrow('invalid or unreadable logging config file format')
		})
	})
})
