import { Command, Config, Interfaces } from '@oclif/core'
import { CLIConfig, loadConfig, Profile } from '../cli-config'
import { SmartThingsCommand } from '../smartthings-command'
import { DefaultTableGenerator } from '../table-generator'
import log4js from '@log4js-node/log4js-api'


jest.mock('../cli-config')
jest.mock('../table-generator')
jest.mock('@log4js-node/log4js-api', () => ({
	getLogger: jest.fn(() => ({
		trace: jest.fn(),
		warn: jest.fn(),
	})),
}))


describe('SmartThingsCommand', () => {
	class TestCommand extends SmartThingsCommand<typeof TestCommand.flags> {
		async run(): Promise<void> {
			// eslint-disable-line @typescript-eslint/no-empty-function
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
		async parse(options?: Interfaces.Input<any>, argv?: string[]): Promise<Interfaces.ParserOutput<any, any>> {
			return {
				flags: {},
				args: {},
				argv: [],
				raw: [],
				metadata: { flags: {} },
			}
		}
	}

	let smartThingsCommand: TestCommand
	const testConfig = new Config({ root: '' })

	const loadConfigMock = jest.mocked(loadConfig)
	const parseSpy = jest.spyOn(TestCommand.prototype, 'parse')
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	type parserOutputType = Interfaces.ParserOutput<any, any>

	beforeEach(() => {
		smartThingsCommand = new TestCommand([], testConfig)
	})

	it('should set profile name to default during setup if not specified elsewhere', async () => {
		await smartThingsCommand.init()

		expect(smartThingsCommand.profileName).toBe('default')
	})

	it('should set profile name via flags when passed during setup', async () => {
		const profileName = 'notDefault'
		const parserOutput = { args: {}, flags: { profile: profileName } } as parserOutputType
		parseSpy.mockResolvedValueOnce(parserOutput)
		await smartThingsCommand.init()

		expect(smartThingsCommand.profileName).toBe(profileName)
	})

	it('should set tableGenerator to group rows by default during setup', async () => {
		await smartThingsCommand.init()

		expect(smartThingsCommand.tableGenerator).toBeInstanceOf(DefaultTableGenerator)
		expect(DefaultTableGenerator).toBeCalledWith(true)
	})

	it('should override default table group rows when passed via profile during setup', async () => {
		const profile: Profile = {
			groupTableOutputRows: false,
		}

		loadConfigMock.mockResolvedValueOnce({ profile } as CLIConfig)

		await smartThingsCommand.init()

		expect(smartThingsCommand.tableGenerator).toBeInstanceOf(DefaultTableGenerator)
		expect(DefaultTableGenerator).toBeCalledWith(false)
	})

	it('should override groupTableOutputRows when --no-group-rows flag passed during setup', async () => {
		const profile: Profile = {
			groupTableOutputRows: true,
		}

		loadConfigMock.mockResolvedValueOnce({ profile } as CLIConfig)

		parseSpy.mockResolvedValueOnce({ args: {}, flags: { 'no-group-rows': true } } as parserOutputType)
		await smartThingsCommand.init()

		expect(smartThingsCommand.tableGenerator).toBeInstanceOf(DefaultTableGenerator)
		expect(DefaultTableGenerator).toBeCalledWith(false)
	})

	it('should override table row grouping when --group-rows flag passed during setup', async () => {
		const profile: Profile = {
			groupTableOutputRows: false,
		}

		loadConfigMock.mockResolvedValueOnce({ profile } as CLIConfig)

		const groupRows = true
		parseSpy.mockResolvedValueOnce({ args: {}, flags: { 'group-rows': groupRows } } as parserOutputType)
		await smartThingsCommand.init()

		expect(smartThingsCommand.tableGenerator).toBeInstanceOf(DefaultTableGenerator)
		expect(DefaultTableGenerator).toBeCalledWith(groupRows)
	})

	it('should abort command with message and successful exit', () => {
		const logSpy = jest.spyOn(Command.prototype, 'log').mockImplementation()
		const exitSpy = jest.spyOn(Command.prototype, 'exit').mockImplementation()
		const message = 'aborting command'

		smartThingsCommand.abort(message)

		expect(logSpy).toBeCalledWith(message)
		expect(exitSpy).toBeCalledWith(0)
	})

	it('should set logger during setup', async () => {
		const getLoggerMock = jest.mocked(log4js.getLogger)
		await smartThingsCommand.init()

		expect(smartThingsCommand.logger).toBeDefined()
		expect(getLoggerMock).toBeCalledWith('cli.TestCommand')
	})

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
})
