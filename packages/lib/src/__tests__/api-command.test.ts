import { Config } from '@oclif/config'
import { v4 as uuidv4 } from 'uuid'
import * as osLocale from 'os-locale'

import { SmartThingsClient } from '@smartthings/core-sdk'
import * as coreSDK from '@smartthings/core-sdk'

import { APICommand } from '../api-command'
import { CLIConfig } from '../cli-config'
import { ClientIdProvider } from '../login-authenticator'


jest.mock('os-locale')
jest.mock('@smartthings/core-sdk')
jest.mock('../cli-config')
jest.mock('../logger')
jest.mock('../login-authenticator')


describe('api-command', () => {
	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('APICommand', () => {
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
		}

		let apiCommand: testCommand
		const testConfig = new Config({ root: '' })

		beforeEach(() => {
			apiCommand = new testCommand([], testConfig)
		})

		it('should throw Error when not properly setup', async () => {
			await expect(apiCommand.run()).rejects.toEqual(new Error('APICommand not properly initialized'))
		})

		it('should not throw Error when properly setup', async () => {
			await apiCommand.setup({}, [], {})

			expect(apiCommand.run()).resolves
		})

		it('should set token when passed via flags during setup', async () => {
			const token = uuidv4()
			await apiCommand.setup({}, [], { token: token })

			expect(apiCommand.getToken()).toBe(token)
			expect(SmartThingsClient).toHaveBeenCalledTimes(1)
		})

		it('should pass language header on to client', async () => {
			await apiCommand.setup({}, [], { language: 'es-US' })
			const stClientSpy = jest.spyOn(coreSDK, 'SmartThingsClient')

			expect(stClientSpy).toHaveBeenCalledTimes(1)

			const configUsed = stClientSpy.mock.calls[0][1]
			expect(configUsed?.headers).toEqual({ 'Accept-Language': 'es-US' })
		})

		it('should skip language header when "NONE" specified', async () => {
			await apiCommand.setup({}, [], { language: 'NONE' })
			const stClientSpy = jest.spyOn(coreSDK, 'SmartThingsClient')

			expect(stClientSpy).toHaveBeenCalledTimes(1)

			const configUsed = stClientSpy.mock.calls[0][1]
			expect(configUsed).toBeDefined()
			expect(configUsed?.headers).toEqual({})
		})

		it('should uses os language header when not specified', async () => {
			const osLocaleSpy = jest.spyOn(osLocale, 'default').mockResolvedValue('fr-CA')
			await apiCommand.setup({}, [], {})
			const stClientSpy = jest.spyOn(coreSDK, 'SmartThingsClient')

			expect(stClientSpy).toHaveBeenCalledTimes(1)

			expect(osLocaleSpy).toHaveBeenCalledTimes(1)
			const configUsed = stClientSpy.mock.calls[0][1]
			expect(configUsed?.headers).toEqual({ 'Accept-Language': 'fr-CA' })
		})

		it('should set token when passed via profileConfig during setup', async () => {
			const token = uuidv4()
			jest.spyOn(CLIConfig.prototype, 'getProfile').mockImplementation(() => {
				return {
					token: token,
				}
			})

			await apiCommand.setup({}, [], {})

			expect(apiCommand.getToken()).toBe(token)
		})

		it('should override default clientIdProvider when set in profileConfig during setup', async () => {
			const testClientId = uuidv4()
			const profileConfig = {
				clientIdProvider: {
					clientId: testClientId,
				},
			}

			jest.spyOn(CLIConfig.prototype, 'getProfile').mockImplementation(() => {
				return profileConfig
			})

			await apiCommand.setup({}, [], {})

			expect(apiCommand.getClientIdProvider()).toStrictEqual(profileConfig.clientIdProvider)
		})
	})
})
