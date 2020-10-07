import { Command } from '@oclif/command'
import { Config } from '@oclif/config'
import { NoLogLogger } from '@smartthings/core-sdk'
import { CLIConfig } from '../cli-config'
import { LogManager } from '../logger'
import { SmartThingsCommand } from '../smartthings-command'
import { DefaultTableGenerator } from '../table-generator'


jest.mock('../cli-config')
jest.mock('../table-generator')


describe('smartthings-command', () => {
	describe('SmartThingsCommand', () => {
		/* eslint-disable @typescript-eslint/no-explicit-any */
		class testCommand extends SmartThingsCommand {
			async setupSuper(args: { [name: string]: any }, argv: string[], flags: { [name: string]: any }): Promise<void> {
				await super.setup(args, argv, flags)
			}

			getProfileConfig(): { [name: string]: any } {
				return this.profileConfig
			}

			getArgs(): { [name: string]: any } {
				return this.args
			}

			getInputArgs(): string[] {
				return this.inputArgs
			}

			getFlags(): { [name: string]: any } {
				return this.flags
			}

			getProfileName(): string {
				return this.profileName
			}

			callAbort(message?: string): void {
				this.abort(message)
			}

			async run(): Promise<void> {
				// eslint-disable-line @typescript-eslint/no-empty-function
			}
		}
		/* eslint-enable @typescript-eslint/no-explicit-any */

		let smartThingsCommand: testCommand
		const testConfig = new Config({ root: '' })

		beforeEach(() => {
			smartThingsCommand = new testCommand([], testConfig)
		})

		afterEach(() => {
			jest.resetAllMocks()
		})

		it('should throw Error when not properly setup', async () => {
			const message = 'SmartThingsCommand not properly initialized'

			expect(() => { smartThingsCommand.getProfileConfig() }).toThrowError(message)
			expect(() => { smartThingsCommand.getArgs() }).toThrowError(message)
			expect(() => { smartThingsCommand.getInputArgs() }).toThrowError(message)
			expect(() => { smartThingsCommand.getFlags() }).toThrowError(message)
			expect(() => { smartThingsCommand.getProfileName() }).toThrowError(message)
			expect(() => { smartThingsCommand.tableGenerator }).toThrowError(message)
		})

		it('should not throw Error when properly setup', async () => {
			await smartThingsCommand.setupSuper({}, [], {})

			expect(() => { smartThingsCommand.getProfileConfig() }).not.toThrow()
			expect(() => { smartThingsCommand.getArgs() }).not.toThrow()
			expect(() => { smartThingsCommand.getInputArgs() }).not.toThrow()
			expect(() => { smartThingsCommand.getFlags() }).not.toThrow()
			expect(() => { smartThingsCommand.getProfileName() }).not.toThrow()
			expect(() => { smartThingsCommand.tableGenerator }).not.toThrow()
		})

		it('should set profile name to default during setup if not specified elsewhere', async () => {
			await smartThingsCommand.setupSuper({}, [], {})

			expect(smartThingsCommand.getProfileName()).toBe('default')
		})

		it('should set profile name via flags when passed during setup', async () => {
			const profileName = 'notDefault'
			await smartThingsCommand.setupSuper({}, [], { profile: profileName })

			expect(smartThingsCommand.getProfileName()).toBe(profileName)
		})

		it('should set tableGenerator to compact by default during setup', async () => {
			await smartThingsCommand.setupSuper({}, [], {})

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

			await smartThingsCommand.setupSuper({}, [], {})

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
			await smartThingsCommand.setupSuper({}, [], { expanded: expanded })

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
			await smartThingsCommand.setupSuper({}, [], { compact: compact })

			expect(smartThingsCommand.tableGenerator).toBeInstanceOf(DefaultTableGenerator)
			expect(DefaultTableGenerator).toBeCalledWith(compact)
		})

		it('should abort command with message and successful exit', () => {
			const logSpy = jest.spyOn(Command.prototype, 'log').mockImplementation()
			const processSpy = jest.spyOn(process, 'exit').mockImplementation()
			const message = 'aborting command'

			smartThingsCommand.callAbort(message)

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
	})
})
