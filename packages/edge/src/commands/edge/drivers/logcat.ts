import { CliUx, Errors, Flags } from '@oclif/core'
import inquirer from 'inquirer'
import { promises as fs } from 'fs'
import { PeerCertificate } from 'tls'
import {
	DriverInfo,
	handleConnectionErrors,
	isLiveLogMessage,
	LiveLogClient,
	LiveLogClientConfig,
	LiveLogMessage,
	liveLogMessageFormatter,
	LogLevel,
	parseIpAndPort,
} from '../../../lib/live-logging'
import {
	askForRequiredString,
	convertToId,
	EventSourceError,
	green,
	logEvent,
	red,
	selectFromList,
	SelectFromListConfig,
	Sorting,
	SseCommand,
	stringTranslateToId,
	TableFieldDefinition,
} from '@smartthings/cli-lib'
import { inspect } from 'util'
import { runForever } from '../../../lib/commands/drivers/logcat-util'


const DEFAULT_ALL_TEXT = 'all'
const DEFAULT_LIVE_LOG_PORT = 9495
const DEFAULT_LIVE_LOG_TIMEOUT = 30_000 // milliseconds

/**
 * Define labels to stay consistent with other driver commands
 */
const driverFieldDefinitions: TableFieldDefinition<DriverInfo>[] = [
	{
		prop: 'driver_id',
		label: 'Driver Id',
	},
	{
		prop: 'driver_name',
		label: 'Name',
	},
]

async function promptForDrivers(fieldInfo: Sorting<DriverInfo>, list: DriverInfo[], prompt?: string): Promise<string> {
	const primaryKeyName = fieldInfo.primaryKeyName

	const itemIdOrIndex: string = (await inquirer.prompt({
		type: 'input',
		name: 'itemIdOrIndex',
		message: prompt ?? 'Enter id or index',
		default: DEFAULT_ALL_TEXT,
		validate: input => {
			return input === DEFAULT_ALL_TEXT ||
				convertToId(input, primaryKeyName, list)
				? true
				: `Invalid id or index "${input}". Please enter an index or valid id.`
		},
	})).itemIdOrIndex

	const inputId = itemIdOrIndex == DEFAULT_ALL_TEXT ? itemIdOrIndex : convertToId(itemIdOrIndex, primaryKeyName, list)
	if (inputId === false) {
		throw Error(`unable to convert ${itemIdOrIndex} to id`)
	}

	return inputId
}

interface KnownHub {
	hostname: string
	fingerprint: string
}

export default class LogCatCommand extends SseCommand<typeof LogCatCommand.flags> {
	private authority!: string
	private logClient!: LiveLogClient

	static description = 'stream logs from installed drivers'

	/* eslint-disable @typescript-eslint/naming-convention */
	static flags = {
		...SseCommand.flags,
		all: Flags.boolean({
			char: 'a',
			description: 'stream from all installed drivers',
		}),
		'hub-address': Flags.string({
			description: 'IPv4 address of hub with optionally appended port number',
		}),
		'connect-timeout': Flags.integer({
			description: 'max time allowed when connecting to hub',
			helpValue: '<milliseconds>',
			default: DEFAULT_LIVE_LOG_TIMEOUT,
		}),
		'log-level': Flags.string({
			description: 'minimum level of event to log',
			helpValue: '<string>',
			default: 'TRACE',
		}),
	}
	/* eslint-enable @typescript-eslint/naming-convention */

	static args = [
		{
			name: 'driverId',
			description: 'a specific driver to stream logs from',
		},
	]

	private getMinLogLevel(): number {
		const minLogLevel = this.flags['log-level'].toUpperCase() as keyof typeof LogLevel

		if (Object.keys(LogLevel).includes(minLogLevel)) {
			return LogLevel[minLogLevel]
		}

		this.warn(`${this.flags['log-level']} is not a valid log-level. Logging all events.`)
		return 0
	}

	private async checkServerIdentity(cert: PeerCertificate): Promise<void | never> {
		const knownHubsPath = `${this.config.cacheDir}/known_hubs.json`
		let knownHubs: Partial<Record<string, KnownHub>> = {}
		try {
			knownHubs = JSON.parse(await fs.readFile(knownHubsPath, 'utf-8'))
		} catch (error) {
			if (error.code !== 'ENOENT') { throw error }
		}

		const known = knownHubs[this.authority]
		if (!known || known.fingerprint !== cert.fingerprint) {
			await CliUx.ux.action.pauseAsync(async () => {
				this.warn(`The authenticity of ${this.authority} can't be established. Certificate fingerprint is ${cert.fingerprint}`)
				const verified = (await inquirer.prompt({
					type: 'confirm',
					name: 'connect',
					message: 'Are you sure you want to continue connecting?',
					default: false,
				})).connect

				if (!verified) {
					this.error('Hub verification failed.')
				}

				knownHubs[this.authority] = { hostname: this.authority, fingerprint: cert.fingerprint }
				await fs.writeFile(knownHubsPath, JSON.stringify(knownHubs))

				this.warn(`Permanently added ${this.authority} to the list of known hubs.`)
			})
		}
	}

	private async chooseHubDrivers(commandLineDriverId?: string, driversList?: DriverInfo[]): Promise<string> {
		const config: SelectFromListConfig<DriverInfo> = {
			itemName: 'driver',
			primaryKeyName: 'driver_id',
			sortKeyName: 'driver_name',
			listTableFieldDefinitions: driverFieldDefinitions,
		}

		const list = driversList !== undefined ? Promise.resolve(driversList) : this.logClient.getDrivers()
		const preselectedId = await stringTranslateToId(config, commandLineDriverId, () => list)
		return selectFromList(this, config,
			{ preselectedId, listItems: () => list, getIdFromUser: promptForDrivers })
	}

	async init(): Promise<void> {
		await super.init()

		const hubIpAddress = this.flags['hub-address'] ?? await askForRequiredString('Enter hub IP address with optionally appended port number:')
		const [ipv4, port] = parseIpAndPort(hubIpAddress)
		const liveLogPort = port ?? DEFAULT_LIVE_LOG_PORT
		this.authority = `${ipv4}:${liveLogPort}`

		const config: LiveLogClientConfig = {
			authority: this.authority,
			authenticator: this.authenticator,
			verifier: this.checkServerIdentity.bind(this),
			timeout: this.flags['connect-timeout'] ?? DEFAULT_LIVE_LOG_TIMEOUT,
			userAgent: this.userAgent,
		}

		this.logClient = new LiveLogClient(config)
	}

	async run(): Promise<void> {
		CliUx.ux.action.start('connecting')

		// ensure host verification resolves before connecting to the event source
		const installedDrivers = await this.logClient.getDrivers()

		let sourceURL: string
		if (this.flags.all) {
			sourceURL = this.logClient.getLogSource()
		} else {
			const driverId = await CliUx.ux.action.pauseAsync(() => this.chooseHubDrivers(this.args.driverId, installedDrivers))
			sourceURL = driverId == DEFAULT_ALL_TEXT ? this.logClient.getLogSource() : this.logClient.getLogSource(driverId)
		}

		await this.initSource(sourceURL)

		const sourceTimeoutID = setTimeout(() => {
			this.teardown()
			CliUx.ux.action.stop(red('failed'))
			try {
				handleConnectionErrors(this.authority, 'ETIMEDOUT')
			} catch (error) {
				if (error instanceof Error) {
					Errors.handle(error)
				}
			}
		}, this.flags['connect-timeout']).unref() // unref lets Node exit before callback is invoked

		this.source.onopen = () => {
			clearTimeout(sourceTimeoutID)

			if (installedDrivers.length === 0) {
				this.warn('No drivers currently installed.')
			}

			CliUx.ux.action.stop(green('connected'))
		}

		this.source.onerror = (error: EventSourceError) => {
			this.teardown()
			CliUx.ux.action.stop(red('failed'))
			this.logger.debug(`Error from eventsource. URL: ${sourceURL} Error: ${inspect(error)}`)
			try {
				if (error.status === 401 || error.status === 403) {
					this.error(`Unauthorized at ${this.authority}`)
				}

				if (error.message !== undefined) {
					handleConnectionErrors(this.authority, error.message)
				}

				this.error(`Unexpected error from event source ${inspect(error)}`)
			} catch (error) {
				if (error instanceof Error) {
					Errors.handle(error)
				}
			}
		}

		const minLogLevel = this.getMinLogLevel()

		this.source.onmessage = (event: MessageEvent<string>) => {
			// TODO refactor cli-libs sse-io module to export parse utils
			const message = this.parseEvent(event)
			if (message.log_level >= minLogLevel) {
				// TODO separate parsing and logging in sse-io so that logEvent can accept a parsed message
				logEvent(event, liveLogMessageFormatter)
			}
		}

		await runForever()
	}

	async catch(error: unknown): Promise<void> {
		// exit gracefully for Command.exit(0)
		if (error instanceof Errors.ExitError && error.oclif.exit === 0) {
			this.teardown()
			return
		}

		CliUx.ux.action.stop(red('failed'))
		await super.catch(error)
	}

	parseEvent(event: MessageEvent): LiveLogMessage {
		let message: unknown
		try {
			message = JSON.parse(event.data)
		} catch (error) {
			this.error(`Unable to parse received event. ${error.message ?? error}`)
		}

		if (isLiveLogMessage(message)) {
			return message
		} else {
			throw Error('Unexpected log message type.')
		}
	}
}
