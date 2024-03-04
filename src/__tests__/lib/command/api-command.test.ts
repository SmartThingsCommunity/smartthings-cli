import { jest } from '@jest/globals'

import { osLocale } from 'os-locale'

import { Authenticator, Logger, RESTClientConfig, SmartThingsClient, WarningFromHeader } from '@smartthings/core-sdk'

import { SmartThingsCommand, smartThingsCommand, smartThingsCommandBuilder } from '../../../lib/command/smartthings-command.js'
import { newBearerTokenAuthenticator, newSmartThingsClient } from '../../../lib/command/util/st-client-wrapper.js'
import { coreSDKLoggerFromLog4JSLogger } from '../../../lib/log-utils.js'
import { defaultClientIdProvider, loginAuthenticator } from '../../../lib/login-authenticator.js'
import { TableGenerator } from '../../../lib/table-generator.js'


const { errorMock, loggerMock } = await import('../../test-lib/logger-mock.js')

const osLocaleMock: jest.Mock<typeof osLocale> = jest.fn()
osLocaleMock.mockResolvedValue('OS Locale')
jest.unstable_mockModule('os-locale', () => ({
	osLocale: osLocaleMock,
}))

const coreSDKLoggerFromLog4JSLoggerMock: jest.Mock<typeof coreSDKLoggerFromLog4JSLogger> = jest.fn()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const coreSDKWarnMock: jest.Mock<(message: any, ...args: any[]) => void> = jest.fn()
const coreSDKLogger = {
	warn: coreSDKWarnMock,
} as unknown as Logger
coreSDKLoggerFromLog4JSLoggerMock.mockReturnValue(coreSDKLogger)
jest.unstable_mockModule('../../../lib/log-utils.js', async () => ({
	coreSDKLoggerFromLog4JSLogger: coreSDKLoggerFromLog4JSLoggerMock,
}))

const stringConfigValueMock = jest.fn<SmartThingsCommand['stringConfigValue']>()
const buildTableFromListMock = jest.fn<TableGenerator['buildTableFromList']>()
buildTableFromListMock.mockReturnValue('table built from list')
const stCommandMock = {
	configDir: 'test-config-dir',
	profileName: 'profile-from-parent',
	profile: {},
	logger: loggerMock,
	stringConfigValue: stringConfigValueMock,
	tableGenerator: {
		buildTableFromList: buildTableFromListMock,
	},
} as unknown as SmartThingsCommand
const smartThingsCommandMock: jest.Mock<typeof smartThingsCommand> = jest.fn()
smartThingsCommandMock.mockResolvedValue(stCommandMock)
jest.unstable_mockModule('../../../lib/command/smartthings-command.js', () => ({
	smartThingsCommandBuilder,
	smartThingsCommand: smartThingsCommandMock,
}))

const loginAuthenticatorMock: jest.Mock<typeof loginAuthenticator> = jest.fn()
const mockAuthenticator = { mock: 'authenticator' } as unknown as Authenticator
loginAuthenticatorMock.mockReturnValue(mockAuthenticator)
jest.unstable_mockModule('../../../lib/login-authenticator.js', () => ({
	defaultClientIdProvider,
	loginAuthenticator: loginAuthenticatorMock,
}))

const newBearerTokenAuthenticatorMock = jest.fn<typeof newBearerTokenAuthenticator>()
const newSmartThingsClientMock = jest.fn<typeof newSmartThingsClient>()
const clientMock = { fake: 'client' } as unknown as SmartThingsClient
newSmartThingsClientMock.mockReturnValue(clientMock)
jest.unstable_mockModule('../../../lib/command/util/st-client-wrapper.js', () => ({
	newBearerTokenAuthenticator: newBearerTokenAuthenticatorMock,
	newSmartThingsClient: newSmartThingsClientMock,
}))

const { apiCommand, apiDocsURL, itemInputHelpText, userAgent } = await import('../../../lib/command/api-command.js')


describe('apiDocsURL', () => {
	it('produces URL', () => {
		expect(apiDocsURL('getDevice'))
			.toBe('For API information, see:\n\n' +
				'  https://developer.smartthings.com/docs/api/public/#operation/getDevice')
	})

	it('joins multiple pages with line breaks', () => {
		expect(apiDocsURL('getDevice', 'getDevices'))
			.toBe('For API information, see:\n\n' +
				'  https://developer.smartthings.com/docs/api/public/#operation/getDevice\n' +
				'  https://developer.smartthings.com/docs/api/public/#operation/getDevices')
	})
})

describe('itemInputHelpText', () => {
	it('works with external URLs', () => {
		expect(itemInputHelpText('https://adafruit.com', 'https://digikey.com'))
			.toBe('More information can be found at:\n' +
				'  https://adafruit.com\n' +
				'  https://digikey.com')
	})

	it('builds URLs like `apiDocsURL`', () => {
		expect(itemInputHelpText('getDevice'))
			.toBe('More information can be found at:\n' +
				'  https://developer.smartthings.com/docs/api/public/#operation/getDevice')
	})
})

describe('apiCommand', () => {
	const flags = { profile: 'cmd-line-profile' }
	it('includes output from "parent" smartThingsCommand', async () => {
		const result = await apiCommand(flags)

		expect(result.configDir).toBe('test-config-dir')
		expect(result.profile).toBe(stCommandMock.profile)

		expect(smartThingsCommandMock).toHaveBeenCalledTimes(1)
		expect(smartThingsCommandMock).toHaveBeenCalledWith(flags)
	})

	describe('token handling', () => {
		it('leaves token undefined when not specified anywhere', async () => {
			stringConfigValueMock.mockReturnValueOnce(undefined)

			const result = await apiCommand(flags)

			expect(result.token).toBeUndefined()
			expect(stringConfigValueMock).toHaveBeenCalledTimes(1)
			expect(stringConfigValueMock).toHaveBeenCalledWith('token')
			expect(newBearerTokenAuthenticatorMock).toHaveBeenCalledTimes(0)
			expect(loginAuthenticatorMock).toHaveBeenCalledTimes(1)
			expect(loginAuthenticatorMock).toHaveBeenCalledWith(
				'test-config-dir/credentials.json',
				'profile-from-parent',
				defaultClientIdProvider, userAgent)
		})

		it('uses token from command line', async () => {
			const result = await apiCommand({ profile: 'default', token: 'token-from-cmd-line' })

			expect(result.token).toBe('token-from-cmd-line')
			expect(stringConfigValueMock).toHaveBeenCalledTimes(0)
			expect(newBearerTokenAuthenticatorMock).toHaveBeenCalledTimes(1)
			expect(newBearerTokenAuthenticatorMock).toHaveBeenCalledWith('token-from-cmd-line')
			expect(loginAuthenticatorMock).toHaveBeenCalledTimes(0)
		})

		it('uses token from config file', async () => {
			stringConfigValueMock.mockReturnValueOnce('token-from-config-file')

			const result = await apiCommand(flags)

			expect(result.token).toBe('token-from-config-file')
			expect(stringConfigValueMock).toHaveBeenCalledTimes(1)
			expect(stringConfigValueMock).toHaveBeenCalledWith('token')
			expect(newBearerTokenAuthenticatorMock).toHaveBeenCalledTimes(1)
			expect(newBearerTokenAuthenticatorMock).toHaveBeenCalledWith('token-from-config-file')
			expect(loginAuthenticatorMock).toHaveBeenCalledTimes(0)
		})

		it('uses token from command line over token from config file', async () => {
			const result = await apiCommand({ profile: 'default', token: 'token-from-cmd-line' })

			expect(result.token).toBe('token-from-cmd-line')
			expect(stringConfigValueMock).toHaveBeenCalledTimes(0)
			expect(newBearerTokenAuthenticatorMock).toHaveBeenCalledTimes(1)
			expect(newBearerTokenAuthenticatorMock).toHaveBeenCalledWith('token-from-cmd-line')
			expect(loginAuthenticatorMock).toHaveBeenCalledTimes(0)
		})

		it('normalizes empty token to undefined', async () => {
			stringConfigValueMock.mockReturnValueOnce('')
			const result = await apiCommand(flags)

			expect(result.token).toBe(undefined)
			expect(stringConfigValueMock).toHaveBeenCalledTimes(1)
			expect(stringConfigValueMock).toHaveBeenCalledWith('token')
			expect(newBearerTokenAuthenticatorMock).toHaveBeenCalledTimes(0)
			expect(loginAuthenticatorMock).toHaveBeenCalledTimes(1)
			expect(loginAuthenticatorMock).toHaveBeenCalledWith(
				'test-config-dir/credentials.json',
				'profile-from-parent',
				defaultClientIdProvider, userAgent)
		})
	})

	describe('clientIdProvider handling', () => {
		it('uses defaultClientIdProvider when none provided in configuration', async () => {
			const result = await apiCommand(flags)

			expect(result.clientIdProvider).toBe(defaultClientIdProvider)
		})

		it('uses value from config', async () => {
			const clientIdProvider = {
				notReally: 'valid',
				needToFix: 'this test when we do more input checking',
			}
			smartThingsCommandMock.mockResolvedValueOnce({
				...stCommandMock,
				profile: {
					clientIdProvider,
				},
			})

			const result = await apiCommand(flags)

			expect(result.clientIdProvider).toStrictEqual(clientIdProvider)
		})

		it('logs error and uses default when config is not an object', async () => {
			smartThingsCommandMock.mockResolvedValueOnce({
				...stCommandMock,
				profile: {
					clientIdProvider: 'not an object!',
				},
			})

			const result = await apiCommand(flags)

			expect(errorMock).toHaveBeenCalledWith('ignoring invalid configClientIdProvider')
			expect(result.clientIdProvider).toBe(defaultClientIdProvider)
		})
	})

	describe('http request header handling', () => {
		it('includes user agent and os locale by default', async () => {
			const result = await apiCommand(flags)

			expect(newSmartThingsClientMock).toHaveBeenCalledTimes(1)
			expect(newSmartThingsClientMock).toHaveBeenCalledWith(
				mockAuthenticator,
				expect.objectContaining({
					headers: expect.objectContaining({
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'User-Agent': userAgent,
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'Accept-Language': 'OS Locale',
					}),
				}),
			)

			expect(result.client).toBe(clientMock)
		})

		it('uses language flag', async () => {
			const result = await apiCommand({ profile: 'default', language: 'es_MX' })

			expect(newSmartThingsClientMock).toHaveBeenCalledTimes(1)
			expect(newSmartThingsClientMock).toHaveBeenCalledWith(
				mockAuthenticator,
				expect.objectContaining({
					headers: expect.objectContaining({
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'Accept-Language': 'es_MX',
					}),
				}),
			)

			expect(result.client).toBe(clientMock)
		})

		it('skips language header when "NONE" specified', async () => {
			const result = await apiCommand({ profile: 'default', language: 'NONE' })

			expect(newSmartThingsClientMock).toHaveBeenCalledTimes(1)
			expect(newSmartThingsClientMock).toHaveBeenCalledWith(
				mockAuthenticator,
				expect.objectContaining({
					headers: expect.not.objectContaining({
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'Accept-Language': expect.anything(),
					}),
				}),
			)

			expect(result.client).toBe(clientMock)
		})

		it('calls addAdditionalHeaders to include extra headers when present', async () => {
			const addAdditionalHeaders = jest.fn()
			const result = await apiCommand(flags, addAdditionalHeaders)

			expect(newSmartThingsClientMock).toHaveBeenCalledTimes(1)
			expect(addAdditionalHeaders).toHaveBeenCalledTimes(1)
			expect(addAdditionalHeaders).toHaveBeenCalledWith(stCommandMock, expect.objectContaining({
				// eslint-disable-next-line @typescript-eslint/naming-convention
				'User-Agent': userAgent,
			}))
			expect(result.client).toBe(clientMock)
		})
	})

	describe('warningLogger', () => {
		const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { /*no-op*/ })

		type WarningLoggerFunc = (warnings: WarningFromHeader[] | string) => void
		const getWarningLogger = async (): Promise<WarningLoggerFunc> => {
			await apiCommand(flags)

			const warningLogger = (newSmartThingsClientMock.mock.calls[0][1] as RESTClientConfig).warningLogger
			expect(warningLogger).toBeDefined()
			if (!warningLogger) {
				throw Error('warning logger not passed')
			}
			return warningLogger
		}

		it('logs string response with "from API" note', async () => {
			const warningLogger = await getWarningLogger()

			expect(warningLogger('simple string warning message'))

			expect(coreSDKWarnMock).toHaveBeenCalledTimes(1)
			expect(coreSDKWarnMock).toHaveBeenCalledWith('Warnings from API:\nsimple string warning message')
			expect(warnSpy).toHaveBeenCalledWith('Warnings from API:\nsimple string warning message')
		})

		it('uses table generator to format more complex messages', async () => {
			const warningLogger = await getWarningLogger()

			expect(warningLogger([
				{ code: 404, agent: 'Thursday Next', text: 'Cheshire cat shenanigans' },
			]))

			expect(coreSDKWarnMock).toHaveBeenCalledTimes(1)
			expect(coreSDKWarnMock).toHaveBeenCalledWith('Warnings from API:\ntable built from list')
			expect(warnSpy).toHaveBeenCalledWith('Warnings from API:\ntable built from list')
		})
	})
})
