import log4js from 'log4js'
import osLocale from 'os-locale'
import { type Argv } from 'yargs'

import {
	type Authenticator,
	chinaSmartThingsURLProvider,
	type HttpClientHeaders,
	type SmartThingsClient,
	type SmartThingsURLProvider,
	type WarningFromHeader,
} from '@smartthings/core-sdk'

import { coreSDKLoggerFromLog4JSLogger } from '../log-utils.js'
import { type ClientIdProvider, globalClientIdProvider, loginAuthenticator } from '../login-authenticator.js'
import { fatalError } from '../util.js'
import {
	type SmartThingsCommand,
	type SmartThingsCommandFlags,
	smartThingsCommand,
	smartThingsCommandBuilder,
} from './smartthings-command.js'
import { newBearerTokenAuthenticator, newSmartThingsClient } from './util/st-client-wrapper.js'


export const userAgent = '@smartthings/cli'

export type URLProvider = SmartThingsURLProvider & Partial<ClientIdProvider>
export const urlProvidersByEnvironment: { [key: string]: URLProvider } = {
	global: globalClientIdProvider,
	china: chinaSmartThingsURLProvider,
}

export type APICommandFlags =
	& SmartThingsCommandFlags
	& {
		environment?: string
		token?: string
		language?: string
	}

export const apiCommandBuilder = <T extends object>(yargs: Argv<T>): Argv<T & APICommandFlags> =>
	smartThingsCommandBuilder(yargs)
		.option('environment', {
			desc: 'the environment to use',
			type: 'string',
			choices: Object.keys(urlProvidersByEnvironment),
		})
		.option('token', {
			alias: 't',
			desc: 'the auth token to use',
			type: 'string',
			default: process.env.SMARTTHINGS_TOKEN,
			hidden: true,
		})
		.option('language', {
			desc: 'ISO language code or "NONE" to not specify a language. Defaults to the OS locale',
			type: 'string',
		})

export type APICommand<T extends APICommandFlags = APICommandFlags> = SmartThingsCommand<T> & {
	environment: string
	token?: string
	urlProvider: SmartThingsURLProvider
	authenticator: Authenticator
	client: SmartThingsClient
}

/**
 * Base for commands that need to use Rest API via the SmartThings Core SDK.
 */
export const apiCommand = async <T extends APICommandFlags>(
	flags: T,
	addAdditionalHeaders?: (stCommand: SmartThingsCommand<T>, headers: HttpClientHeaders) => void,
): Promise<APICommand<T>> => {
	const stCommand = await smartThingsCommand(flags)

	// The `|| undefined` at then end of this line is to normalize falsy values to `undefined`.
	const token = (flags.token ?? stCommand.cliConfig.stringConfigValue('token')) || undefined

	// Calculate the environment and clientIdProvider. In old configs, the clientIdProvider had to
	// be specified manually. Now we support specifying the environment, which determines the
	// clientIdProvider. If both are specified, environment wins. If only one is specified, calculate
	// the other based on it. If neither is specified, use the globalClientIdProvider.
	const calculateEnvironment = (): [string, SmartThingsURLProvider] => {
		const environment = (flags.environment ?? stCommand.cliConfig.stringConfigValue('environment')) || undefined
		// first look for environment; then fall back to the old config style
		if (environment) {
			if (environment in urlProvidersByEnvironment) {
				return [environment, urlProvidersByEnvironment[environment]]
			}
			return fatalError(`unknown environment: ${environment}`)
		}

		const configClientIdProvider = stCommand.profile.clientIdProvider
		if (configClientIdProvider) {
			if (typeof configClientIdProvider !== 'object') {
				stCommand.logger.error('ignoring invalid configClientIdProvider')
			} else {
				const clientIdProvider = configClientIdProvider as ClientIdProvider
				// Look up the environment based on the clientIdProvider.baseURL.
				const environment = Object.entries(urlProvidersByEnvironment)
					.find(([, provider]) => provider.baseURL === clientIdProvider.baseURL)?.[0]
					?? 'unknown'
				return [environment, clientIdProvider]
			}
		}
		return ['global', globalClientIdProvider]
	}

	const [environment, urlProvider] = calculateEnvironment()
	const logger = coreSDKLoggerFromLog4JSLogger(log4js.getLogger('rest-client'))

	const buildHeaders = async (): Promise<HttpClientHeaders> => {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		const headers: HttpClientHeaders = { 'User-Agent': userAgent }

		if (flags.language) {
			if (flags.language !== 'NONE') {
				headers['Accept-Language'] = flags.language
			}
		} else {
			headers['Accept-Language'] = osLocale()
		}

		return headers
	}
	const headers = await buildHeaders()
	if (addAdditionalHeaders) {
		addAdditionalHeaders(stCommand, headers)
	}

	const buildAuthenticator = (): Authenticator => {
		if (token) {
			return newBearerTokenAuthenticator(token)
		}
		if ('clientId' in urlProvider) {
			return loginAuthenticator(
				`${stCommand.dataDir}/credentials.json`,
				stCommand.profileName,
				urlProvider as ClientIdProvider,
				userAgent,
			)
		}
		return fatalError(
			environment === 'china'
				? 'a token is required for the china environment'
				: 'no authentication method available',
		)
	}
	const authenticator = buildAuthenticator()

	const warningLogger = (warnings: WarningFromHeader[] | string): void => {
		const message = 'Warnings from API:\n' + (typeof(warnings) === 'string'
			? warnings
			: stCommand.tableGenerator.buildTableFromList(warnings, ['code', 'agent', 'text', 'date']))
		logger.warn(message)
		console.warn(message)
	}
	const client = newSmartThingsClient(authenticator,
		{ urlProvider: urlProvider, logger, headers, warningLogger })

	return {
		...stCommand,
		environment,
		token,
		urlProvider,
		authenticator,
		client,
	}
}
