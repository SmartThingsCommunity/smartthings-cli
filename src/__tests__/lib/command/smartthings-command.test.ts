import { jest } from '@jest/globals'

import log4js from 'log4js'

import { CLIConfig, loadConfig } from '../../../lib/cli-config.js'
import { buildDefaultLog4jsConfig, loadLog4jsConfig } from '../../../lib/log-utils.js'
import { defaultTableGenerator } from '../../../lib/table-generator.js'
import { buildArgvMock } from '../../test-lib/builder-mock.js'
import { SmartThingsCommandFlags } from '../../../lib/command/smartthings-command.js'


const { configureMock, getLoggerMock } = await import('../../test-lib/logger-mock.js')

const loadConfigMock = jest.fn<typeof loadConfig>()
jest.unstable_mockModule('../../../lib/cli-config.js', () => ({
	loadConfig: loadConfigMock,
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


const { smartThingsCommandBuilder, smartThingsCommand } = await import('../../../lib/command/smartthings-command.js')


test('smartThingsCommandBuilder', () => {
	const { envMock, optionMock, argvMock } = buildArgvMock<object, SmartThingsCommandFlags>()

	expect(smartThingsCommandBuilder(argvMock)).toBe(argvMock)

	expect(envMock).toHaveBeenCalledTimes(1)
	expect(optionMock).toHaveBeenCalledTimes(1)
})

describe('smartThingsCommand', () => {
	const defaultLogConfig = { config: 'default' } as unknown as log4js.Configuration
	buildDefaultLog4jsConfigMock.mockReturnValue(defaultLogConfig)
	const logConfig = { config: 'final' } as unknown as log4js.Configuration
	loadLog4jsConfigMock.mockReturnValue(logConfig)
	const cliConfig = { profile: {} } as CLIConfig
	loadConfigMock.mockResolvedValue(cliConfig)

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
			configFilename: expect.stringContaining('/.config/@smartthings/cli/config.yaml'),
			managedConfigFilename: expect.stringContaining('/.config/@smartthings/cli/config-managed.yaml'),
			profileName: 'default',
		})
		expect(defaultTableGeneratorMock).toHaveBeenCalledTimes(1)
		expect(defaultTableGeneratorMock).toHaveBeenCalledWith({ groupRows: true })
	})

	// TODO: these will eventually go in cli-config.test.ts
	/*
	describe('stringConfigValue', () => {
		it('returns undefined when not set', async () => {
			await smartThingsCommand.init()

			expect('configKey' in smartThingsCommand.profile).toBeFalse()
			expect(smartThingsCommand.stringConfigValue('configKey')).toBeUndefined()
		})

		it('returns config value when defined', async () => {
			const profile: Profile = { configKey: 'config value' }
			loadConfigMock.mockResolvedValueOnce({ profile } as CLIConfig)

			await smartThingsCommand.init()

			expect(smartThingsCommand.profile.configKey).toEqual('config value')
			expect(smartThingsCommand.stringConfigValue('configKey')).toBe('config value')
		})

		it('returns undefined when configured value is not a string', async () => {
			const profile: Profile = { configKey: ['value1', 'value2'] }
			loadConfigMock.mockResolvedValueOnce({ profile } as CLIConfig)

			await smartThingsCommand.init()

			expect(smartThingsCommand.profile.configKey).toEqual(['value1', 'value2'])
			expect(smartThingsCommand.stringConfigValue('configKey')).toBeUndefined()
		})

		it('returns default value when not set', async () => {
			await smartThingsCommand.init()

			expect('configKey' in smartThingsCommand.profile).toBeFalse()
			expect(smartThingsCommand.stringConfigValue('configKey', 'default value'))
				.toBe('default value')
		})

		it('returns default value when configured value is not a string', async () => {
			const profile: Profile = { configKey: ['value1', 'value2'] }
			loadConfigMock.mockResolvedValueOnce({ profile } as CLIConfig)

			await smartThingsCommand.init()

			expect(smartThingsCommand.profile.configKey).toEqual(['value1', 'value2'])
			expect(smartThingsCommand.stringConfigValue('configKey', 'default value'))
				.toBe('default value')
		})
	})

	describe('stringArrayConfigValue', () => {
		it('returns [] when not set', async () => {
			await smartThingsCommand.init()

			expect('configKey' in smartThingsCommand.profile).toBeFalse()
			expect(smartThingsCommand.stringArrayConfigValue('configKey')).toEqual([])
		})

		it('returns string config value as single-item array', async () => {
			const profile: Profile = { configKey: 'config value' }
			loadConfigMock.mockResolvedValueOnce({ profile } as CLIConfig)

			await smartThingsCommand.init()

			expect(smartThingsCommand.profile.configKey).toEqual('config value')
			expect(smartThingsCommand.stringArrayConfigValue('configKey')).toEqual(['config value'])
		})

		it('returns array config value when configured', async () => {
			const items = ['config value 1', 'config value 2']
			const profile: Profile = { configKey: items }
			loadConfigMock.mockResolvedValueOnce({ profile } as CLIConfig)

			await smartThingsCommand.init()

			expect(smartThingsCommand.profile.configKey).toEqual(items)
			expect(smartThingsCommand.stringArrayConfigValue('configKey')).toEqual(items)
		})

		it('returns default value when not set', async () => {
			await smartThingsCommand.init()

			expect('configKey' in smartThingsCommand.profile).toBeFalse()
			expect(smartThingsCommand.stringArrayConfigValue('configKey', ['default value']))
				.toEqual(['default value'])
		})

		it('returns default value when configured value is not a string or array', async () => {
			const profile: Profile = { configKey: 5 }
			loadConfigMock.mockResolvedValueOnce({ profile } as CLIConfig)

			await smartThingsCommand.init()

			expect(smartThingsCommand.profile.configKey).toEqual(5)
			expect(smartThingsCommand.stringArrayConfigValue('configKey', ['default value']))
				.toEqual(['default value'])
		})

		it('returns default value when configured value is array but not of strings', async () => {
			const items = [5, { thing: 'one' }]
			const profile: Profile = { configKey: items }
			loadConfigMock.mockResolvedValueOnce({ profile } as CLIConfig)

			await smartThingsCommand.init()

			expect(smartThingsCommand.profile.configKey).toEqual(items)
			expect(smartThingsCommand.stringArrayConfigValue('configKey', ['default value']))
				.toEqual(['default value'])
		})
	})
	*/
})
