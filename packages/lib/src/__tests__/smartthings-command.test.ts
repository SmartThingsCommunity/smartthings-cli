import { Command } from '@oclif/command'
import { Config } from '@oclif/config'
import { NoLogLogger } from '@smartthings/core-sdk'
import { CLIConfig } from '../cli-config'
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

	beforeEach(() => {
		smartThingsCommand = new TestCommand([], testConfig)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('should throw Error when not properly setup', async () => {
		const message = 'SmartThingsCommand not properly initialized'

		expect(() => { smartThingsCommand.profileConfig }).toThrowError(message)
		expect(() => { smartThingsCommand.args }).toThrowError(message)
		expect(() => { smartThingsCommand.inputArgs }).toThrowError(message)
		expect(() => { smartThingsCommand.flags }).toThrowError(message)
		expect(() => { smartThingsCommand.profileName }).toThrowError(message)
		expect(() => { smartThingsCommand.tableGenerator }).toThrowError(message)
	})

	it('should not throw Error when properly setup', async () => {
		await smartThingsCommand.setup({}, [], {})

		expect(() => { smartThingsCommand.profileConfig }).not.toThrow()
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

	it('should override default table compact when passed via profileConfig during setup', async () => {
		const compact = false
		const profileConfig = {
			compactTableOutput: compact,
		}

		jest.spyOn(CLIConfig.prototype, 'getProfile').mockImplementation(() => {
			return profileConfig
		})

		await smartThingsCommand.setup({}, [], {})

		expect(smartThingsCommand.tableGenerator).toBeInstanceOf(DefaultTableGenerator)
		expect(DefaultTableGenerator).toBeCalledWith(compact)
	})

	it('should override table compact when --expanded flag passed during setup', async () => {
		const compact = true
		const profileConfig = {
			compactTableOutput: compact,
		}

		jest.spyOn(CLIConfig.prototype, 'getProfile').mockImplementation(() => {
			return profileConfig
		})

		const expanded = true
		await smartThingsCommand.setup({}, [], { expanded: expanded })

		expect(smartThingsCommand.tableGenerator).toBeInstanceOf(DefaultTableGenerator)
		expect(DefaultTableGenerator).toBeCalledWith(!compact)
	})

	it('should override table compact when --compact flag passed during setup', async () => {
		const profileConfig = {
			compactTableOutput: false,
		}

		jest.spyOn(CLIConfig.prototype, 'getProfile').mockImplementation(() => {
			return profileConfig
		})

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

			expect('configKey' in smartThingsCommand.profileConfig).toBeFalse()
			expect(smartThingsCommand.stringConfigValue('configKey')).toBeUndefined()
		})

		it('returns string when not defined', async () => {
			jest.spyOn(CLIConfig.prototype, 'getProfile').mockImplementation(() => {
				return { configKey: 'config value' }
			})

			await smartThingsCommand.setup({}, [], {})

			expect(smartThingsCommand.profileConfig.configKey).toEqual('config value')
			expect(smartThingsCommand.stringConfigValue('configKey')).toBe('config value')
		})

		it('returns undefined when configured value is not a string', async () => {
			jest.spyOn(CLIConfig.prototype, 'getProfile').mockImplementation(() => {
				return { configKey: ['value1', 'value2'] }
			})

			await smartThingsCommand.setup({}, [], {})

			expect(smartThingsCommand.profileConfig.configKey).toEqual(['value1', 'value2'])
			expect(smartThingsCommand.stringConfigValue('configKey')).toBeUndefined()
		})
	})
})
