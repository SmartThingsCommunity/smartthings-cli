import log4js from 'log4js'
import { osLocale } from 'os-locale'
import { Argv } from 'yargs'

import { Authenticator, HttpClientHeaders, SmartThingsClient, WarningFromHeader } from '@smartthings/core-sdk'

import { coreSDKLoggerFromLog4JSLogger } from '../log-utils.js'
import { ClientIdProvider, defaultClientIdProvider, loginAuthenticator } from '../login-authenticator.js'
import { SmartThingsCommand, SmartThingsCommandFlags, smartThingsCommand, smartThingsCommandBuilder } from './smartthings-command.js'
import { newBearerTokenAuthenticator, newSmartThingsClient } from './util/st-client-wrapper.js'


export const userAgent = '@smartthings/cli'

const toURL = (nameOrURL: string): string => nameOrURL.startsWith('http')
	? nameOrURL
	: `https://developer.smartthings.com/docs/api/public/#operation/${nameOrURL}`

export const apiDocsURL = (...names: string[]): string => 'For API information, see:\n\n  ' +
	names.map(name => toURL(name)).join('\n  ')

export const itemInputHelpText = (...namesOrURLs: string[]): string => 'More information can be found at:\n  ' +
	namesOrURLs.map(nameOrURL => toURL(nameOrURL)).join('\n  ')

export type APICommandFlags = SmartThingsCommandFlags & {
	token?: string
	language?: string
}

export const apiCommandBuilder = <T extends object>(yargs: Argv<T>): Argv<T & APICommandFlags> =>
	smartThingsCommandBuilder(yargs)
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
	token?: string
	clientIdProvider: ClientIdProvider
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

	const calculateClientIdProvider = (): ClientIdProvider => {
		const configClientIdProvider = stCommand.profile.clientIdProvider
		if (configClientIdProvider) {
			if (typeof configClientIdProvider !== 'object') {
				stCommand.logger.error('ignoring invalid configClientIdProvider')
			} else {
				// TODO: do more type checking here eventually
				return configClientIdProvider as ClientIdProvider
			}
		}
		return defaultClientIdProvider
	}

	const clientIdProvider = calculateClientIdProvider()
	const logger = coreSDKLoggerFromLog4JSLogger(log4js.getLogger('rest-client'))

	const buildHeaders = async (): Promise<HttpClientHeaders> => {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		const headers: HttpClientHeaders = { 'User-Agent': userAgent }

		if (flags.language) {
			if (flags.language !== 'NONE') {
				headers['Accept-Language'] = flags.language
			}
		} else {
			headers['Accept-Language'] = await osLocale()
		}

		return headers
	}
	const headers = await buildHeaders()
	if (addAdditionalHeaders) {
		addAdditionalHeaders(stCommand, headers)
	}

	const authenticator = token
		? newBearerTokenAuthenticator(token)
		: loginAuthenticator(`${stCommand.dataDir}/credentials.json`, stCommand.profileName, clientIdProvider, userAgent)

	const warningLogger = (warnings: WarningFromHeader[] | string): void => {
		const message = 'Warnings from API:\n' + (typeof(warnings) === 'string'
			? warnings
			: stCommand.tableGenerator.buildTableFromList(warnings, ['code', 'agent', 'text', 'date']))
		logger.warn(message)
		console.warn(message)
	}
	const client = newSmartThingsClient(authenticator,
		{ urlProvider: clientIdProvider, logger, headers, warningLogger })

	return {
		...stCommand,
		token,
		clientIdProvider,
		authenticator,
		client,
	}
}
