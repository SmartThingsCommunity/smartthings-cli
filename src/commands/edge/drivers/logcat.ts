import { PeerCertificate } from 'node:tls'
import { inspect } from 'node:util'

import ora from 'ora'
import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { green, red } from '../../../lib/colors.js'
import {
	handleConnectionErrors,
	type LiveLogClientConfig,
	liveLogMessageFormatter,
	type LogLevel,
	logLevels,
	newLiveLogClient,
	parseIpAndPort,
} from '../../../lib/live-logging.js'
import { logEvent, parseEvent } from '../../../lib/sse-io.js'
import { EventSourceError, handleSignals } from '../../../lib/sse-util.js'
import { fatalError } from '../../../lib/util.js'
import { apiCommand, apiCommandBuilder, APICommandFlags, userAgent } from '../../../lib/command/api-command.js'
import { initSource } from '../../../lib/command/sse-command.js'
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

const describe = 'stream logs from installed drivers'

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
					console.log(`coerce; arg = ${arg}`)
					const logLevel = arg ? arg.toLowercase() : 'trace'
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

	const config: LiveLogClientConfig = {
		authority,
		authenticator: command.authenticator,
		verifier: (cert: PeerCertificate) => checkServerIdentity(command, authority, cert),
		timeout: argv.connectTimeout ?? defaultLiveLogTimeout,
		userAgent,
	}

	const logClient = newLiveLogClient(config)

	// ensure host verification resolves before connecting to the event source
	const installedDrivers = await logClient.getDrivers()

	const driverId = argv.all
		? undefined
		: await chooseHubDrivers(command, installedDrivers, argv.driverId)

	spinner.start('connecting')
	const sourceURL = logClient.getLogSource(driverId)

	const { source, teardown } = await initSource(command, sourceURL)

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

	const setupSignalHandler = (): void => {
		handleSignals(signal => {
			command.logger.debug(`handling ${signal} and tearing down SseCommand`)

			teardown()
		})
	}

	source.onopen = () => {
		clearTimeout(sourceTimeoutId)

		if (installedDrivers.length === 0) {
			console.warn('No drivers currently installed.')
		}

		spinner.succeed(green('connected'))
		setupSignalHandler()
	}

	source.onerror = (error: EventSourceError) => {
		teardown()
		spinner.fail(red('failed'))
		command.logger.debug(`Error from eventsource. URL: ${sourceURL} Error: ${inspect(error)}`)
		try {
			if (error.status === 401 || error.status === 403) {
				return fatalError(`Unauthorized at ${authority}`)
			}

			if (error.message !== undefined) {
				handleConnectionErrors(authority, error.message)
			}

			console.error(`Unexpected error from event source ${inspect(error)}`)
		} catch (error) {
			if (error instanceof Error) {
				return fatalError(error)
			}
		}
	}

	const logLevel = logLevels[argv.logLevel ?? 'trace']
	source.onmessage = (event: MessageEvent<string>) => {
		const message = parseEvent(event)
		if (message.log_level >= logLevel.value) {
			logEvent(message, liveLogMessageFormatter)
		}
	}
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
