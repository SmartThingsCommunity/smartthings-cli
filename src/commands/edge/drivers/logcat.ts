import { type ClientRequest } from 'node:http'
import { Agent as AxiosAgent } from 'node:https'
import { type PeerCertificate, type TLSSocket } from 'node:tls'
import { inspect } from 'node:util'

import axios, { type AxiosError, type AxiosResponse, type Method } from 'axios'
import { type ErrorEvent, EventSource } from 'eventsource'
import log4js from 'log4js'
import ora from 'ora'
import { fetch, Agent } from 'undici'
import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { green, red } from '../../../lib/colors.js'
import { buildEpilog } from '../../../lib/help.js'
import {
	type DriverInfo,
	handleConnectionErrors,
	liveLogMessageFormatter,
	type LogLevel,
	logLevels,
	networkEnvironmentInfo,
	parseIpAndPort,
	scrubAuthInfo,
} from '../../../lib/live-logging.js'
import { logEvent, parseEvent } from '../../../lib/sse-io.js'
import { fatalError, handleSignals } from '../../../lib/util.js'
import { apiCommand, apiCommandBuilder, type APICommandFlags, userAgent } from '../../../lib/command/api-command.js'
import { chooseHub } from '../../../lib/command/util/hubs-choose.js'
import { checkServerIdentity, chooseHubDrivers } from '../../../lib/command/util/hub-drivers.js'


const defaultLiveLogPort = 9495
const defaultLiveLogTimeout = 30_000 // milliseconds

export type CommandArgs =
	& APICommandFlags
	& {
		all?: boolean
		hubAddress?: string
		hub?: string
		connectTimeout?: number
		logLevel?: LogLevel
		driverId?: string
	}

const command = 'edge:drivers:logcat [driver-id]'

const describe = 'stream logs from installed drivers, simple temporary hard-coded version'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiCommandBuilder(yargs)
		.positional('driver-id', { describe: 'a specific driver to stream logs from', type: 'string' })
		.option('all', { alias: 'a', describe: 'stream from all installed drivers', type: 'boolean' })
		.option(
			'hub-address',
			{ describe: 'IPv4 address of hub with optionally appended port number', type: 'string' },
		)
		.option(
			'connect-timeout',
			{
				describe: 'max time allowed when connecting to hub in milliseconds',
				type: 'number',
				default: defaultLiveLogTimeout,
			},
		)
		.option(
			'log-level',
			{
				describe: 'minimum level of event to log',
				type: 'string',
				default: 'trace',
				choices: Object.keys(logLevels),
				coerce: arg => {
					const logLevel = arg ? arg.toLowerCase() : 'trace'
					if ((logLevel in logLevels)) {
						return logLevel
					}
					console.warn(`${arg} is not a valid log-level. Logging all events.`)
					return 'trace'
				},
			},
		)
		.example([
			['$0 edge:drivers:logcat', 'choose hub and driver from prompts'],
			['$0 edge:drivers:logcat --log-level WARN', 'log only at WARN level and above'],
			[
				'$0 edge:drivers:logcat --all --hub-address 192.168.1.13',
				'log for all drivers on hub with IP address 192.168.1.13',
			],
		])
		.epilog(buildEpilog({ command }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const askUserForHub = async (): Promise<string> => {
		const hubId = await chooseHub(command, undefined, { useConfigDefault: true })
		const hubDevice = await command.client.devices.get(hubId)
		const localIP = hubDevice.hub?.hubData.localIP
		if (!localIP) {
			return fatalError('Could not find hub IP address.')
		}
		return localIP
	}

	const hubIpAddress = argv.hubAddress ?? await askUserForHub()
	const [ipv4, port] = parseIpAndPort(hubIpAddress)
	const liveLogPort = port ?? defaultLiveLogPort
	const authority = `${ipv4}:${liveLogPort}`
	const spinner = ora()
	const verifier = (cert: PeerCertificate): Promise<void> => checkServerIdentity(command, authority, cert)
	const timeout = argv.connectTimeout ?? defaultLiveLogTimeout

	const baseURL = new URL(`https://${authority}`)

	const driversURL = new URL('drivers', baseURL)
	const logsURL = new URL('drivers/logs', baseURL)
	let hostVerified = false
	const logger = log4js.getLogger('cli')

	const getCertificate = (response: AxiosResponse): PeerCertificate =>
		((response.request as ClientRequest).socket as TLSSocket).getPeerCertificate()

	const unsafeAgent = new Agent({
		connect: {
			rejectUnauthorized: false,
		},
	})
	const request = async (url: string, method: Method = 'GET'): Promise<AxiosResponse> => {
		// Even though we are using `fetch` from `undici` below, sticking to axios here, at least
		// for now, because I have been unable to make `fetch` work here.
		const authHeaders = await command.authenticator.authenticate()
		const requestConfig = {
			url,
			method,
			httpsAgent: new AxiosAgent({ rejectUnauthorized: false }),
			timeout,
			// eslint-disable-next-line @typescript-eslint/naming-convention
			headers: { 'User-Agent': userAgent, ...authHeaders },
			transitional: {
				silentJSONParsing: true,
				forcedJSONParsing: true,
				// throw ETIMEDOUT error instead of generic ECONNABORTED on request timeouts
				clarifyTimeoutError: true,
			},
		}

		try {
			const response = await axios.request(requestConfig)
			if (!hostVerified) {
				await verifier(getCertificate(response))
				hostVerified = true
			}

			return response
		} catch (error) {
			console.log('*** error caught')
			if (error.isAxiosError) {
				const axiosError = error as AxiosError
				if (logger.isDebugEnabled()) {
					const errorString = scrubAuthInfo(axiosError.toJSON())
					logger.debug(`Error connecting to live-logging: ${errorString}\n\nLocal network interfaces:` +
						` ${networkEnvironmentInfo()}`)
				}

				if (axiosError.code) {
					handleConnectionErrors(authority, axiosError.code)
				}
			}

			throw error
		}
	}

	const getDrivers = async (): Promise<DriverInfo[]> => (await request(driversURL.toString())).data

	const getLogSource = (driverId?: string): string => {
		const sourceURL = logsURL

		if (driverId) {
			sourceURL.searchParams.set('driver_id', driverId)
		}

		return sourceURL.toString()
	}

	// ensure host verification resolves before connecting to the event source
	const installedDrivers = await getDrivers()

	const driverId = argv.all
		? undefined
		: await chooseHubDrivers(command, installedDrivers, argv.driverId)

	spinner.start('connecting')
	const sourceURL = getLogSource(driverId)

	// assume auth is taken care of if passing an initDict
	const authHeaders = await command.authenticator.authenticate()

	// eslint-disable-next-line @typescript-eslint/naming-convention
	const headers: HeadersInit = { 'User-Agent': userAgent, ...authHeaders }

	const source = new EventSource(sourceURL, {
		fetch: async (input, init) => {
			// I haven't been able to successfully make this request with axios, so for now, we're
			// sticking to how the eventsource examples do it with `fetch` from `undici`.
			const results = await fetch(input.toString(), {
				...init,
				dispatcher: unsafeAgent,
				headers: {
					...init.headers,
					...headers,
				},
			})

			return results
		},
	})

	const teardown = (): void => {
		try {
			source.close()
		} catch (error) {
			command.logger.warn(`Error during SseCommand teardown. ${error.message ?? error}`)
		}
	}

	source.addEventListener('notice', event => {
		command.logger.warn(`unexpected notice event: ${inspect(event)}`)
	})

	source.addEventListener('update', event => {
		command.logger.warn(`unexpected update event: ${inspect(event)}`)
	})

	const logLevel = logLevels[argv.logLevel ?? 'trace']
	source.addEventListener('message', event => {
		const message = parseEvent(event)
		if (message.log_level >= logLevel.value) {
			logEvent(message, liveLogMessageFormatter)
		}
	})

	source.addEventListener('error', (error: ErrorEvent) => {
		teardown()
		spinner.fail(red('failed'))

		command.logger.debug(`Error from eventsource. URL: ${sourceURL} Error: ${inspect(error)}`)

		try {
			if (error.code === 401 || error.code === 403) {
				return fatalError(`Unauthorized at ${authority}`)
			}

			if (error.message !== undefined) {
				return handleConnectionErrors(authority, error.message)
			}

			console.error(`Unexpected error from event source ${inspect(error)}`)
		} catch (error) {
			if (error instanceof Error) {
				return fatalError(error)
			}
		}
	})

	const sourceTimeoutId = setTimeout(() => {
		teardown()
		spinner.fail(red('failed'))
		try {
			handleConnectionErrors(authority, 'ETIMEDOUT')
		} catch (error) {
			if (error instanceof Error) {
				return fatalError(error)
			}
		}
	}, argv.connectTimeout).unref() // unref lets Node exit before callback is invoked

	handleSignals(signal => {
		command.logger.debug(`handling ${signal} and tearing down SseCommand`)

		teardown()
	})

	source.onopen = () => {
		clearTimeout(sourceTimeoutId)

		if (installedDrivers.length === 0) {
			console.warn('No drivers currently installed.')
		}

		spinner.succeed(green('connected'))
	}
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
