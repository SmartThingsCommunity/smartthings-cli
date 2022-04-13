import { Command, Config } from '@oclif/core'

import { NoLogLogger } from '@smartthings/core-sdk'

import { CLIConfig, loadConfig, Profile } from '../cli-config'
import { LogManager } from '../logger'
import { SmartThingsCommand } from '../smartthings-command'
import { DefaultTableGenerator } from '../table-generator'


jest.mock('../cli-config')
jest.mock('../table-generator')


describe('SmartThingsCommand', () => {
	/* eslint-disable @typescript-eslint/no-explicit-any */
	class TestCommand extends SmartThingsCommand {
		async run(): Promise<void> {
			// eslint-disable-line @typescript-eslint/no-empty-function
		}
	}
	/* eslint-enable @typescript-eslint/no-explicit-any */

	let smartThingsCommand: TestCommand
	const testConfig = new Config({ root: '' })

	const loadConfigMock = jest.mocked(loadConfig)

	beforeEach(() => {
		smartThingsCommand = new TestCommand([], testConfig)
	})

	it('should throw Error when not properly setup', async () => {
		const message = 'SmartThingsCommand not properly initialized'

		expect(() => { smartThingsCommand.profile }).toThrowError(message)
		expect(() => { smartThingsCommand.args }).toThrowError(message)
		expect(() => { smartThingsCommand.inputArgs }).toThrowError(message)
		expect(() => { smartThingsCommand.flags }).toThrowError(message)
		expect(() => { smartThingsCommand.profileName }).toThrowError(message)
		expect(() => { smartThingsCommand.tableGenerator }).toThrowError(message)
	})

	it('should not throw Error when properly setup', async () => {
		await smartThingsCommand.setup({}, [], {})

		expect(() => { smartThingsCommand.profile }).not.toThrow()
		expect(() => { smartThingsCommand.args }).not.toThrow()
		expect(() => { smartThingsCommand.inputArgs }).not.toThrow()
		expect(() => { smartThingsCommand.flags }).not.toThrow()
		expect(() => { smartThingsCommand.profileName }).not.toThrow()
		expect(() => { smartThingsCommand.tableGenerator }).not.toThrow()
	})

	it('should set profile name to default during setup if not specified elsewhere', async () => {
		await smartThingsCommand.setup({}, [], {})

		expect(smartThingsCommand.profileName).toBe('default')
	})

	it('should set profile name via flags when passed during setup', async () => {
		const profileName = 'notDefault'
		await smartThingsCommand.setup({}, [], { profile: profileName })

		expect(smartThingsCommand.profileName).toBe(profileName)
	})

	it('should set tableGenerator to compact by default during setup', async () => {
		await smartThingsCommand.setup({}, [], {})

		expect(smartThingsCommand.tableGenerator).toBeInstanceOf(DefaultTableGenerator)
		expect(DefaultTableGenerator).toBeCalledWith(true)
	})

	it('should override default table compact when passed via profile during setup', async () => {
		const compact = false
		const profile: Profile = {
			compactTableOutput: compact,
		}

		loadConfigMock.mockResolvedValueOnce({ profile } as CLIConfig)

		await smartThingsCommand.setup({}, [], {})

		expect(smartThingsCommand.tableGenerator).toBeInstanceOf(DefaultTableGenerator)
		expect(DefaultTableGenerator).toBeCalledWith(compact)
	})

	it('should override table compact when --expanded flag passed during setup', async () => {
		const compact = true
		const profile: Profile = {
			compactTableOutput: compact,
		}

		loadConfigMock.mockResolvedValueOnce({ profile } as CLIConfig)

		const expanded = true
		await smartThingsCommand.setup({}, [], { expanded: expanded })

		expect(smartThingsCommand.tableGenerator).toBeInstanceOf(DefaultTableGenerator)
		expect(DefaultTableGenerator).toBeCalledWith(!compact)
	})

	it('should override table compact when --compact flag passed during setup', async () => {
		const profile: Profile = {
			compactTableOutput: false,
		}

		loadConfigMock.mockResolvedValueOnce({ profile } as CLIConfig)

		const compact = true
		await smartThingsCommand.setup({}, [], { compact: compact })

		expect(smartThingsCommand.tableGenerator).toBeInstanceOf(DefaultTableGenerator)
		expect(DefaultTableGenerator).toBeCalledWith(compact)
	})

	it('should abort command with message and successful exit', () => {
		const logSpy = jest.spyOn(Command.prototype, 'log').mockImplementation()
		const processSpy = jest.spyOn(process, 'exit').mockImplementation()
		const message = 'aborting command'

		smartThingsCommand.abort(message)

		expect(logSpy).toBeCalledWith(message)
		expect(processSpy).toBeCalledWith(0)
	})

	it('should set logger on first access', () => {
		const logManagerSpy = jest.spyOn(LogManager.prototype, 'getLogger').mockImplementation(() => {
			return new NoLogLogger()
		})

		expect(smartThingsCommand.logger).toBeInstanceOf(NoLogLogger)
		expect(logManagerSpy).toBeCalledWith('cli')
	})

	describe('stringConfigValue', () => {
		jest.spyOn(LogManager.prototype, 'getLogger').mockImplementation(() => {
			return new NoLogLogger()
		})

		it('returns undefined when not set', async () => {
			await smartThingsCommand.setup({}, [], {})

			expect('configKey' in smartThingsCommand.profile).toBeFalse()
			expect(smartThingsCommand.stringConfigValue('configKey')).toBeUndefined()
		})

		it('returns config value when defined', async () => {
			const profile: Profile = { configKey: 'config value' }
			loadConfigMock.mockResolvedValueOnce({ profile } as CLIConfig)

			await smartThingsCommand.setup({}, [], {})

			expect(smartThingsCommand.profile.configKey).toEqual('config value')
			expect(smartThingsCommand.stringConfigValue('configKey')).toBe('config value')
		})

		it('returns undefined when configured value is not a string', async () => {
			const profile: Profile = { configKey: ['value1', 'value2'] }
			loadConfigMock.mockResolvedValueOnce({ profile } as CLIConfig)

			await smartThingsCommand.setup({}, [], {})

			expect(smartThingsCommand.profile.configKey).toEqual(['value1', 'value2'])
			expect(smartThingsCommand.stringConfigValue('configKey')).toBeUndefined()
		})

		it('returns default value when not set', async () => {
			await smartThingsCommand.setup({}, [], {})

			expect('configKey' in smartThingsCommand.profile).toBeFalse()
			expect(smartThingsCommand.stringConfigValue('configKey', 'default value'))
				.toBe('default value')
		})

		it('returns default value when configured value is not a string', async () => {
			const profile: Profile = { configKey: ['value1', 'value2'] }
			loadConfigMock.mockResolvedValueOnce({ profile } as CLIConfig)

			await smartThingsCommand.setup({}, [], {})

			expect(smartThingsCommand.profile.configKey).toEqual(['value1', 'value2'])
			expect(smartThingsCommand.stringConfigValue('configKey', 'default value'))
				.toBe('default value')
		})
	})

	describe('stringArrayConfigValue', () => {
		jest.spyOn(LogManager.prototype, 'getLogger').mockImplementation(() => {
			return new NoLogLogger()
		})

		it('returns [] when not set', async () => {
			await smartThingsCommand.setup({}, [], {})

			expect('configKey' in smartThingsCommand.profile).toBeFalse()
			expect(smartThingsCommand.stringArrayConfigValue('configKey')).toEqual([])
		})

		it('returns string config value as single-item array', async () => {
			const profile: Profile = { configKey: 'config value' }
			loadConfigMock.mockResolvedValueOnce({ profile } as CLIConfig)

			await smartThingsCommand.setup({}, [], {})

			expect(smartThingsCommand.profile.configKey).toEqual('config value')
			expect(smartThingsCommand.stringArrayConfigValue('configKey')).toEqual(['config value'])
		})

		it('returns array config value when configured', async () => {
			const items = ['config value 1', 'config value 2']
			const profile: Profile = { configKey: items }
			loadConfigMock.mockResolvedValueOnce({ profile } as CLIConfig)

			await smartThingsCommand.setup({}, [], {})

			expect(smartThingsCommand.profile.configKey).toEqual(items)
			expect(smartThingsCommand.stringArrayConfigValue('configKey')).toEqual(items)
		})

		it('returns default value when not set', async () => {
			await smartThingsCommand.setup({}, [], {})

			expect('configKey' in smartThingsCommand.profile).toBeFalse()
			expect(smartThingsCommand.stringArrayConfigValue('configKey', ['default value']))
				.toEqual(['default value'])
		})

		it('returns default value when configured value is not a string or array', async () => {
			const profile: Profile = { configKey: 5 }
			loadConfigMock.mockResolvedValueOnce({ profile } as CLIConfig)

			await smartThingsCommand.setup({}, [], {})

			expect(smartThingsCommand.profile.configKey).toEqual(5)
			expect(smartThingsCommand.stringArrayConfigValue('configKey', ['default value']))
				.toEqual(['default value'])
		})

		it('returns default value when configured value is array but not of strings', async () => {
			const items = [5, { thing: 'one' }]
			const profile: Profile = { configKey: items }
			loadConfigMock.mockResolvedValueOnce({ profile } as CLIConfig)

			await smartThingsCommand.setup({}, [], {})

			expect(smartThingsCommand.profile.configKey).toEqual(items)
			expect(smartThingsCommand.stringArrayConfigValue('configKey', ['default value']))
				.toEqual(['default value'])
		})
	})
})
