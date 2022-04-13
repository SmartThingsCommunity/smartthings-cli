import { Config } from '@oclif/core'
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
jest.mock('../logger')
jest.mock('../login-authenticator')


describe('api-command', () => {
	describe('APICommand', () => {
		const buildTableFromListMock = jest.fn()
		const mockedTableGenerator = {
			buildTableFromList: buildTableFromListMock,
		} as unknown as TableGenerator

		const stClientSpy = jest.spyOn(coreSDK, 'SmartThingsClient')

		class testCommand extends APICommand {
			getToken(): string | undefined {
				return this.token
			}

			getClientIdProvider(): ClientIdProvider {
				return this.clientIdProvider
			}

			async run(): Promise<void> {
				this.client
			}

			get tableGenerator(): TableGenerator {
				return mockedTableGenerator
			}
		}

		const loadConfigMock = jest.mocked(loadConfig)

		let apiCommand: testCommand

		beforeEach(() => {
			apiCommand = new testCommand([], {} as Config)
			apiCommand.warn = jest.fn()
		})

		it('should throw Error when not properly setup', async () => {
			await expect(apiCommand.run()).rejects.toEqual(new Error('APICommand not properly initialized'))
		})

		it('accessing authenticator throws Error when not properly setup', async () => {
			expect(() => apiCommand.authenticator).toThrow('APICommand not properly initialized')
		})

		it('accessing client throws Error when not properly setup', async () => {
			expect(() => apiCommand.client).toThrow('APICommand not properly initialized')
		})

		it('should not throw Error when properly setup', async () => {
			await apiCommand.setup({}, [], {})

			expect(apiCommand.run()).resolves
		})

		it('should set token when passed via flags during setup', async () => {
			const token = 'token-from-cmd-line'
			await apiCommand.setup({}, [], { token })

			expect(apiCommand.getToken()).toBe(token)
			expect(SmartThingsClient).toHaveBeenCalledTimes(1)
		})

		it('should pass language header on to client', async () => {
			await apiCommand.setup({}, [], { language: 'es-US' })

			expect(stClientSpy).toHaveBeenCalledTimes(1)

			const configUsed = stClientSpy.mock.calls[0][1]
			expect(configUsed?.headers).toContainEntry(['Accept-Language', 'es-US'])
		})

		it('passes organization flag on to client', async () => {
			await apiCommand.setup({}, [], { organization: 'organization-id-from-flag' })

			expect(stClientSpy).toHaveBeenCalledTimes(1)

			const configUsed = stClientSpy.mock.calls[0][1]
			expect(configUsed?.headers).toContainEntry(['X-ST-Organization', 'organization-id-from-flag'])
		})

		it('passes organization config on to client', async () => {
			const profile: Profile = { organization: 'organization-id-from-config' }
			loadConfigMock.mockResolvedValueOnce({ profile } as CLIConfig)

			await apiCommand.setup({}, [], {})

			expect(stClientSpy).toHaveBeenCalledTimes(1)

			const configUsed = stClientSpy.mock.calls[0][1]
			expect(configUsed?.headers).toContainEntry(['X-ST-Organization', 'organization-id-from-config'])
		})

		it('returns oclif config User-Agent and default if undefined', () => {
			expect(apiCommand.userAgent).toBe('@smartthings/cli')

			apiCommand = new testCommand([], { userAgent: 'userAgent' } as Config)

			expect(apiCommand.userAgent).toBe('userAgent')
		})

		it('sets User-Agent header on client', async () => {
			await apiCommand.setup({}, [], {})

			expect(stClientSpy).toHaveBeenCalledTimes(1)

			const configUsed = stClientSpy.mock.calls[0][1]
			expect(configUsed?.headers).toContainEntry(['User-Agent', expect.any(String)])
		})

		it('uses BearerTokenAuthenticator in client if token is provided', async () => {
			await apiCommand.setup({}, [], { token: 'token' })

			expect(stClientSpy).toBeCalledWith(expect.any(BearerTokenAuthenticator), expect.anything())
		})

		it('uses LoginAuthenticator in client if token is not provided', async () => {
			await apiCommand.setup({}, [], {})

			expect(stClientSpy).toBeCalledWith(expect.any(LoginAuthenticator), expect.anything())

			// sets User-Agent
			expect(LoginAuthenticator).toBeCalledWith(expect.anything(), expect.anything(), expect.any(String))
		})

		it('prefers organization flag over config', async () => {
			const profile: Profile = { organization: 'organization-id-from-config' }
			loadConfigMock.mockResolvedValueOnce({ profile } as CLIConfig)

			await apiCommand.setup({}, [], { organization: 'organization-id-from-flag' })

			expect(stClientSpy).toHaveBeenCalledTimes(1)

			const configUsed = stClientSpy.mock.calls[0][1]
			expect(configUsed?.headers).toContainEntry(['X-ST-Organization', 'organization-id-from-flag'])
		})

		describe('warningLogger', () => {
			it('uses string as-is', async () => {
				await apiCommand.setup({}, [], { language: 'es-US' })

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
				await apiCommand.setup({}, [], { language: 'es-US' })

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
			await apiCommand.setup({}, [], { language: 'NONE' })

			expect(stClientSpy).toHaveBeenCalledTimes(1)

			const configUsed = stClientSpy.mock.calls[0][1]
			expect(configUsed).toBeDefined()
			expect(configUsed?.headers).not.toContainKey('Accept-Language')
		})

		it('should uses os language header when not specified', async () => {
			const osLocaleSpy = jest.spyOn(osLocale, 'default').mockResolvedValue('fr-CA')
			await apiCommand.setup({}, [], {})

			expect(stClientSpy).toHaveBeenCalledTimes(1)

			expect(osLocaleSpy).toHaveBeenCalledTimes(1)
			const configUsed = stClientSpy.mock.calls[0][1]
			expect(configUsed?.headers).toContainEntry(['Accept-Language', 'fr-CA'])
		})

		it('should set token when passed via profile during setup', async () => {
			const token = 'token-from-profile'
			const profile: Profile = { token }
			loadConfigMock.mockResolvedValueOnce({ profile } as CLIConfig)

			await apiCommand.setup({}, [], {})

			expect(apiCommand.getToken()).toBe(token)
		})

		it('should override default clientIdProvider when set in profile during setup', async () => {
			const profile: Profile = {
				clientIdProvider: {
					clientId: 'test-client-id',
				},
			}

			loadConfigMock.mockResolvedValueOnce({ profile } as CLIConfig)

			await apiCommand.setup({}, [], {})

			expect(apiCommand.getClientIdProvider()).toStrictEqual(profile.clientIdProvider)
		})
	})
})
