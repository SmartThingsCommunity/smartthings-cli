import { jest } from '@jest/globals'

import type { osLocale } from 'os-locale'

import {
	type Authenticator,
	type Logger,
	type RESTClientConfig,
	type SmartThingsClient,
	type WarningFromHeader,
} from '@smartthings/core-sdk'

import type {
	SmartThingsCommand,
	SmartThingsCommandFlags,
	smartThingsCommand,
	smartThingsCommandBuilder,
} from '../../../lib/command/smartthings-command.js'
import type { newBearerTokenAuthenticator, newSmartThingsClient } from '../../../lib/command/util/st-client-wrapper.js'
import type { CLIConfig } from '../../../lib/cli-config.js'
import type { coreSDKLoggerFromLog4JSLogger } from '../../../lib/log-utils.js'
import { globalClientIdProvider, type loginAuthenticator } from '../../../lib/login-authenticator.js'
import type { TableGenerator } from '../../../lib/table-generator.js'
import type { fatalError } from '../../../lib/util.js'
import { buildArgvMock } from '../../test-lib/builder-mock.js'


const { errorMock, loggerMock } = await import('../../test-lib/logger-mock.js')

const osLocaleMock = jest.fn<typeof osLocale>()
osLocaleMock.mockResolvedValue('OS Locale')
jest.unstable_mockModule('os-locale', () => ({
	osLocale: osLocaleMock,
}))

const coreSDKLoggerFromLog4JSLoggerMock = jest.fn<typeof coreSDKLoggerFromLog4JSLogger>()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const coreSDKWarnMock = jest.fn<(message: any, ...args: any[]) => void>()
const coreSDKLogger = {
	warn: coreSDKWarnMock,
} as unknown as Logger
coreSDKLoggerFromLog4JSLoggerMock.mockReturnValue(coreSDKLogger)
jest.unstable_mockModule('../../../lib/log-utils.js', async () => ({
	coreSDKLoggerFromLog4JSLogger: coreSDKLoggerFromLog4JSLoggerMock,
}))

const stringConfigValueMock = jest.fn<CLIConfig['stringConfigValue']>()
const cliConfigMock = {
	stringConfigValue: stringConfigValueMock,
}

const buildTableFromListMock = jest.fn<TableGenerator['buildTableFromList']>()
buildTableFromListMock.mockReturnValue('table built from list')
const stCommandMock = {
	configDir: 'test-config-dir',
	dataDir: 'test-data-dir',
	logDir: 'test-log-dir',
	cliConfig: cliConfigMock,
	profileName: 'profile-from-parent',
	profile: {},
	logger: loggerMock,
	tableGenerator: {
		buildTableFromList: buildTableFromListMock,
	},
} as unknown as SmartThingsCommand
const smartThingsCommandBuilderMock = jest.fn<typeof smartThingsCommandBuilder>()
const smartThingsCommandMock = jest.fn<typeof smartThingsCommand>()
smartThingsCommandMock.mockResolvedValue(stCommandMock)
jest.unstable_mockModule('../../../lib/command/smartthings-command.js', () => ({
	smartThingsCommandBuilder: smartThingsCommandBuilderMock,
	smartThingsCommand: smartThingsCommandMock,
}))

const loginAuthenticatorMock = jest.fn<typeof loginAuthenticator>()
const mockAuthenticator = { mock: 'authenticator' } as unknown as Authenticator
loginAuthenticatorMock.mockReturnValue(mockAuthenticator)
jest.unstable_mockModule('../../../lib/login-authenticator.js', () => ({
	globalClientIdProvider,
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

const fatalErrorMock = jest.fn<typeof fatalError>().mockImplementation(() => { throw Error('fatal error')})
jest.unstable_mockModule('../../../lib/util.js', () => ({
	fatalError: fatalErrorMock,
}))


const {
	apiCommand,
	apiCommandBuilder,
	userAgent,
} = await import('../../../lib/command/api-command.js')


test('apiCommandBuilder', () => {
	const { optionMock, argvMock } = buildArgvMock<SmartThingsCommandFlags>()
	smartThingsCommandBuilderMock.mockReturnValueOnce(argvMock)

	expect(apiCommandBuilder(argvMock)).toBe(argvMock)

	expect(smartThingsCommandBuilderMock).toHaveBeenCalledTimes(1)
	expect(smartThingsCommandBuilderMock).toHaveBeenCalledWith(argvMock)
	expect(optionMock).toHaveBeenCalledTimes(3)
})

describe('apiCommand', () => {
	const flags = { profile: 'cmd-line-profile' }
	it('includes output from "parent" smartThingsCommand', async () => {
		const result = await apiCommand(flags)

		expect(result.configDir).toBe('test-config-dir')
		expect(result.dataDir).toBe('test-data-dir')
		expect(result.logDir).toBe('test-log-dir')
		expect(result.profile).toBe(stCommandMock.profile)

		expect(smartThingsCommandMock).toHaveBeenCalledTimes(1)
		expect(smartThingsCommandMock).toHaveBeenCalledWith(flags)
	})

	describe('environment and token handling', () => {
		it('environment is "global" and leaves token undefined when not specified anywhere', async () => {
			stringConfigValueMock.mockReturnValueOnce(undefined)

			const result = await apiCommand(flags)

			expect(result.environment).toBe('global')
			expect(result.token).toBeUndefined()
			expect(stringConfigValueMock).toHaveBeenCalledTimes(2)
			expect(stringConfigValueMock).toHaveBeenCalledWith('token')
			expect(stringConfigValueMock).toHaveBeenCalledWith('environment')
			expect(newBearerTokenAuthenticatorMock).toHaveBeenCalledTimes(0)
			expect(loginAuthenticatorMock).toHaveBeenCalledTimes(1)
			expect(loginAuthenticatorMock).toHaveBeenCalledWith(
				'test-data-dir/credentials.json',
				'profile-from-parent',
				globalClientIdProvider,
				userAgent,
			)
		})

		it('uses environment from command line', async () => {
			const result = await apiCommand({ profile: 'default', environment: 'china', token: 'token-from-cmd-line' })

			expect(result.environment).toBe('china')
			expect(newBearerTokenAuthenticatorMock).toHaveBeenCalledExactlyOnceWith('token-from-cmd-line')
			expect(loginAuthenticatorMock).toHaveBeenCalledTimes(0)
		})

		it('errors out when token required and not provided', async () => {
			await expect(apiCommand({ profile: 'default', environment: 'china' })).rejects.toThrow('fatal error')

			expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith('a token is required for the china environment')
		})

		it('errors out when token required and not provided', async () => {
			const clientIdProvider = {
				baseURL: 'https://api.example.com',
			}
			smartThingsCommandMock.mockResolvedValueOnce({
				...stCommandMock,
				'profile': {
					clientIdProvider,
				},
			})

			await expect(apiCommand(flags)).rejects.toThrow('fatal error')

			expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith('no authentication method available')
		})

		it('uses token from command line', async () => {
			const result = await apiCommand({ profile: 'default', token: 'token-from-cmd-line' })

			expect(result.token).toBe('token-from-cmd-line')
			expect(stringConfigValueMock).toHaveBeenCalledTimes(1)
			expect(stringConfigValueMock).toHaveBeenCalledWith('environment')
			expect(newBearerTokenAuthenticatorMock).toHaveBeenCalledTimes(1)
			expect(newBearerTokenAuthenticatorMock).toHaveBeenCalledWith('token-from-cmd-line')
			expect(loginAuthenticatorMock).toHaveBeenCalledTimes(0)
		})

		it('uses environment from config file', async () => {
			stringConfigValueMock.mockReturnValueOnce('token-from-config-file')
			stringConfigValueMock.mockReturnValueOnce('china')

			const result = await apiCommand(flags)

			expect(result.environment).toBe('china')
			expect(stringConfigValueMock).toHaveBeenCalledTimes(2)
			expect(stringConfigValueMock).toHaveBeenCalledWith('token')
			expect(stringConfigValueMock).toHaveBeenCalledWith('environment')
		})

		it('uses token from config file', async () => {
			stringConfigValueMock.mockReturnValueOnce('token-from-config-file')

			const result = await apiCommand(flags)

			expect(result.token).toBe('token-from-config-file')
			expect(stringConfigValueMock).toHaveBeenCalledTimes(2)
			expect(stringConfigValueMock).toHaveBeenCalledWith('token')
			expect(stringConfigValueMock).toHaveBeenCalledWith('environment')
			expect(newBearerTokenAuthenticatorMock).toHaveBeenCalledTimes(1)
			expect(newBearerTokenAuthenticatorMock).toHaveBeenCalledWith('token-from-config-file')
			expect(loginAuthenticatorMock).toHaveBeenCalledTimes(0)
		})

		it('uses token from command line over token from config file', async () => {
			const result = await apiCommand({ profile: 'default', token: 'token-from-cmd-line' })

			expect(result.token).toBe('token-from-cmd-line')
			expect(stringConfigValueMock).toHaveBeenCalledTimes(1)
			expect(stringConfigValueMock).toHaveBeenCalledWith('environment')
			expect(newBearerTokenAuthenticatorMock).toHaveBeenCalledTimes(1)
			expect(newBearerTokenAuthenticatorMock).toHaveBeenCalledWith('token-from-cmd-line')
			expect(loginAuthenticatorMock).toHaveBeenCalledTimes(0)
		})

		it('normalizes empty token to undefined', async () => {
			stringConfigValueMock.mockReturnValueOnce('')
			const result = await apiCommand(flags)

			expect(result.token).toBe(undefined)
			expect(stringConfigValueMock).toHaveBeenCalledTimes(2)
			expect(stringConfigValueMock).toHaveBeenCalledWith('token')
			expect(stringConfigValueMock).toHaveBeenCalledWith('environment')
			expect(newBearerTokenAuthenticatorMock).toHaveBeenCalledTimes(0)
			expect(loginAuthenticatorMock).toHaveBeenCalledTimes(1)
			expect(loginAuthenticatorMock).toHaveBeenCalledWith(
				'test-data-dir/credentials.json',
				'profile-from-parent',
				globalClientIdProvider, userAgent)
		})
	})

	describe('environment handling', () => {
		it('uses environment from command line over environment from config file', async () => {
			smartThingsCommandMock.mockResolvedValueOnce({
				...stCommandMock,
				profile: {
					environment: 'global',
				},
			})

			const result = await apiCommand({ profile: 'default', environment: 'china', token: 'token-from-cmd-line' })

			expect(result.environment).toBe('china')
			expect(newBearerTokenAuthenticatorMock).toHaveBeenCalledExactlyOnceWith('token-from-cmd-line')
			expect(stringConfigValueMock).toHaveBeenCalledTimes(0)
			expect(loginAuthenticatorMock).toHaveBeenCalledTimes(0)
		})

		it('normalizes empty environment to "global"', async () => {
			stringConfigValueMock.mockReturnValueOnce('')
			const result = await apiCommand(flags)

			expect(result.environment).toBe('global')
			expect(stringConfigValueMock).toHaveBeenCalledTimes(2)
			expect(stringConfigValueMock).toHaveBeenCalledWith('token')
			expect(stringConfigValueMock).toHaveBeenCalledWith('environment')
			expect(loginAuthenticatorMock).toHaveBeenCalledExactlyOnceWith(
				'test-data-dir/credentials.json',
				'profile-from-parent',
				globalClientIdProvider, userAgent)
			expect(newBearerTokenAuthenticatorMock).toHaveBeenCalledTimes(0)
		})
	})

	describe('clientIdProvider handling', () => {
		it('uses globalClientIdProvider when none provided in configuration', async () => {
			const result = await apiCommand(flags)

			expect(result.urlProvider).toBe(globalClientIdProvider)
		})

		it('uses value from config', async () => {
			const clientIdProvider = {
				baseURL: 'https://api.smartthings.com',
			}
			smartThingsCommandMock.mockResolvedValueOnce({
				...stCommandMock,
				'profile': {
					clientIdProvider,
				},
			})
			stringConfigValueMock.mockReturnValueOnce('token-from-config-file')

			const result = await apiCommand(flags)

			expect(result.urlProvider).toStrictEqual(clientIdProvider)
			expect(result.environment).toBe('global')
		})

		it('calculates environment based on clientIdProvider.baseURL', async () => {
			const clientIdProvider = {
				baseURL: 'https://api.samsungiotcloud.cn',
			}
			smartThingsCommandMock.mockResolvedValueOnce({
				...stCommandMock,
				'profile': {
					clientIdProvider,
				},
			})
			stringConfigValueMock.mockReturnValueOnce('token-from-config-file')

			const result = await apiCommand(flags)

			expect(result.urlProvider).toStrictEqual(clientIdProvider)
			expect(result.environment).toBe('china')
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
			expect(result.urlProvider).toBe(globalClientIdProvider)
			expect(result.environment).toBe('global')
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
