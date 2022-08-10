import { Config, Interfaces } from '@oclif/core'
import * as osLocale from 'os-locale'

import { BearerTokenAuthenticator, SmartThingsClient, WarningFromHeader } from '@smartthings/core-sdk'
import * as coreSDK from '@smartthings/core-sdk'

import { APICommand } from '../api-command'
import { CLIConfig, loadConfig, Profile } from '../cli-config'
import { ClientIdProvider, LoginAuthenticator } from '../login-authenticator'
import { TableGenerator } from '..'


jest.mock('os-locale')
jest.mock('@smartthings/core-sdk')
jest.mock('../cli-config')
jest.mock('@log4js-node/log4js-api', () => ({
	getLogger: jest.fn(() => ({
		trace: jest.fn(),
		warn: jest.fn(),
	})),
}))
jest.mock('../login-authenticator')


describe('api-command', () => {
	describe('APICommand', () => {
		const buildTableFromListMock = jest.fn()
		const mockedTableGenerator = {
			buildTableFromList: buildTableFromListMock,
		} as unknown as TableGenerator

		const stClientSpy = jest.spyOn(coreSDK, 'SmartThingsClient')

		class TestCommand extends APICommand<typeof TestCommand.flags> {
			getToken(): string | undefined {
				return this.token
			}

			getClientIdProvider(): ClientIdProvider {
				return this.clientIdProvider
			}

			get tableGenerator(): TableGenerator {
				return mockedTableGenerator
			}

			async run(): Promise<void> {
				// eslint-disable-line @typescript-eslint/no-empty-function
			}

			// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
			async parse(options?: Interfaces.Input<any, any>, argv?: string[]): Promise<Interfaces.ParserOutput<any, any, any>> {
				return {
					flags: {},
					args: {},
					argv: [],
					raw: [],
					metadata: { flags: {} },
				}
			}
		}

		const loadConfigMock = jest.mocked(loadConfig)
		const parseSpy = jest.spyOn(TestCommand.prototype, 'parse')
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		type ParserOutputType = Interfaces.ParserOutput<any, any>

		let apiCommand: TestCommand

		beforeEach(() => {
			apiCommand = new TestCommand([], {} as Config)
			apiCommand.warn = jest.fn()
		})

		it('should set token when passed via flags during setup', async () => {
			const token = 'token-from-cmd-line'
			parseSpy.mockResolvedValueOnce({ args: {}, flags: { token } } as ParserOutputType)
			await apiCommand.init()

			expect(apiCommand.getToken()).toBe(token)
			expect(SmartThingsClient).toHaveBeenCalledTimes(1)
		})

		it('should pass language header on to client', async () => {
			parseSpy.mockResolvedValueOnce({ args: {}, flags: { language: 'es-US' } } as ParserOutputType)
			await apiCommand.init()

			expect(stClientSpy).toHaveBeenCalledTimes(1)

			const configUsed = stClientSpy.mock.calls[0][1]
			expect(configUsed?.headers).toContainEntry(['Accept-Language', 'es-US'])
		})

		it('returns oclif config User-Agent and default if undefined', () => {
			expect(apiCommand.userAgent).toBe('@smartthings/cli')

			apiCommand = new TestCommand([], { userAgent: 'userAgent' } as Config)

			expect(apiCommand.userAgent).toBe('userAgent')
		})

		it('sets User-Agent header on client', async () => {
			await apiCommand.init()

			expect(stClientSpy).toHaveBeenCalledTimes(1)

			const configUsed = stClientSpy.mock.calls[0][1]
			expect(configUsed?.headers).toContainEntry(['User-Agent', expect.any(String)])
		})

		it('uses BearerTokenAuthenticator in client if token is provided', async () => {
			parseSpy.mockResolvedValueOnce({ args: {}, flags: { token: 'token' } } as ParserOutputType)
			await apiCommand.init()

			expect(stClientSpy).toBeCalledWith(expect.any(BearerTokenAuthenticator), expect.anything())
		})

		it('uses LoginAuthenticator in client if token is not provided', async () => {
			await apiCommand.init()

			expect(stClientSpy).toBeCalledWith(expect.any(LoginAuthenticator), expect.anything())

			// sets User-Agent
			expect(LoginAuthenticator).toBeCalledWith(expect.anything(), expect.anything(), expect.any(String))
		})

		describe('warningLogger', () => {
			it('uses string as-is', async () => {
				parseSpy.mockResolvedValueOnce({ args: {}, flags: { language: 'es-US' } } as ParserOutputType)
				await apiCommand.init()

				expect(stClientSpy).toHaveBeenCalledTimes(1)

				const configUsed = stClientSpy.mock.calls[0][1]
				const warningLogger = configUsed?.warningLogger as (warnings: WarningFromHeader[] | string) => void
				expect(warningLogger).toBeDefined()

				void warningLogger('warning')

				expect(apiCommand.logger.warn).toHaveBeenCalledTimes(1)
				const expected = 'Warnings from API:\nwarning'
				expect(apiCommand.logger.warn).toHaveBeenCalledWith(expected)
				expect(apiCommand.warn).toHaveBeenCalledWith(expected)
			})

			it('uses builds table out of list of warnings', async () => {
				parseSpy.mockResolvedValueOnce({ args: {}, flags: { language: 'es-US' } } as ParserOutputType)
				await apiCommand.init()

				expect(stClientSpy).toHaveBeenCalledTimes(1)

				const configUsed = stClientSpy.mock.calls[0][1]
				const warningLogger = configUsed?.warningLogger as (warnings: WarningFromHeader[] | string) => void
				expect(warningLogger).toBeDefined()

				const warnings = [{ text: 'mock warning' } as WarningFromHeader]
				buildTableFromListMock.mockReturnValueOnce('table of warnings')

				void warningLogger(warnings)

				expect(apiCommand.logger.warn).toHaveBeenCalledTimes(1)
				const expected = 'Warnings from API:\ntable of warnings'
				expect(apiCommand.logger.warn).toHaveBeenCalledWith(expected)
				expect(apiCommand.warn).toHaveBeenCalledWith(expected)
				expect(buildTableFromListMock).toHaveBeenCalledTimes(1)
				expect(buildTableFromListMock).toHaveBeenCalledWith(warnings,
					['code', 'agent', 'text', 'date'])
			})
		})

		it('should skip language header when "NONE" specified', async () => {
			parseSpy.mockResolvedValueOnce({ args: {}, flags: { language: 'NONE' } } as ParserOutputType)
			await apiCommand.init()

			expect(stClientSpy).toHaveBeenCalledTimes(1)

			const configUsed = stClientSpy.mock.calls[0][1]
			expect(configUsed).toBeDefined()
			expect(configUsed?.headers).not.toContainKey('Accept-Language')
		})

		it('should uses os language header when not specified', async () => {
			const osLocaleSpy = jest.spyOn(osLocale, 'default').mockResolvedValue('fr-CA')
			await apiCommand.init()

			expect(stClientSpy).toHaveBeenCalledTimes(1)

			expect(osLocaleSpy).toHaveBeenCalledTimes(1)
			const configUsed = stClientSpy.mock.calls[0][1]
			expect(configUsed?.headers).toContainEntry(['Accept-Language', 'fr-CA'])
		})

		it('should set token when passed via profile during setup', async () => {
			const token = 'token-from-profile'
			const profile: Profile = { token }
			loadConfigMock.mockResolvedValueOnce({ profile } as CLIConfig)

			await apiCommand.init()

			expect(apiCommand.getToken()).toBe(token)
		})

		it('should override default clientIdProvider when set in profile during setup', async () => {
			const profile: Profile = {
				clientIdProvider: {
					clientId: 'test-client-id',
				},
			}

			loadConfigMock.mockResolvedValueOnce({ profile } as CLIConfig)

			await apiCommand.init()

			expect(apiCommand.getClientIdProvider()).toStrictEqual(profile.clientIdProvider)
		})
	})
})
