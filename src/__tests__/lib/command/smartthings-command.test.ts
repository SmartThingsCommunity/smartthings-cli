import log4js from 'log4js'

import { CLIConfig, loadConfig } from '../../../lib/cli-config.js'
import { smartThingsCommand } from '../../../lib/command/smartthings-command.js'
import { buildDefaultLog4jsConfig, loadLog4jsConfig } from '../../../lib/log-utils.js'


jest.mock('log4js')
jest.mock('../../../lib/cli-config.js')
jest.mock('../../../lib/log-utils.js')
jest.mock('../../../lib//table-generator')


describe('smartThingsCommand', () => {
	const defaultLogConfig = { config: 'default' } as unknown as log4js.Configuration
	const buildDefaultLog4jsConfigMock = jest.mocked(buildDefaultLog4jsConfig).mockReturnValue(defaultLogConfig)
	const logConfig = { config: 'final' } as unknown as log4js.Configuration
	const loadLog4jsConfigMock = jest.mocked(loadLog4jsConfig).mockReturnValue(logConfig)
	const log4jsConfigureMock = jest.mocked(log4js.configure)
	const traceMock = jest.fn()
	const loggerMock = { trace: traceMock } as unknown as log4js.Logger
	const log4jsGetLoggerMock = jest.mocked(log4js.getLogger).mockReturnValue(loggerMock)
	const cliConfig = { profile: {} } as CLIConfig
	const loadConfigMock = jest.mocked(loadConfig).mockResolvedValue(cliConfig)

	it('works', async () => {
		const flags = { profile: 'default' }
		const result = await smartThingsCommand(flags)

		expect(result.flags).toBe(flags)

		expect(buildDefaultLog4jsConfigMock).toHaveBeenCalledTimes(1)
		expect(buildDefaultLog4jsConfigMock).toHaveBeenCalledWith(expect.stringMatching('/smartthings.log'))
		expect(loadLog4jsConfigMock).toHaveBeenCalledTimes(1)
		expect(loadLog4jsConfigMock).toHaveBeenCalledWith(expect.stringContaining('/logging.yaml'), defaultLogConfig)
		expect(log4jsConfigureMock).toHaveBeenCalledTimes(1)
		expect(log4jsConfigureMock).toHaveBeenCalledWith(logConfig)
		expect(log4jsGetLoggerMock).toHaveBeenCalledTimes(1)
		expect(log4jsGetLoggerMock).toHaveBeenCalledWith('cli')
		expect(loadConfigMock).toHaveBeenCalledTimes(1)
		expect(loadConfigMock).toHaveBeenCalledWith({
			configFilename: expect.stringContaining('/.config/@smartthings/cli/config.yaml'),
			managedConfigFilename: expect.stringContaining('/.config/@smartthings/cli/config-managed.yaml'),
			profileName: 'default',
		})
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
