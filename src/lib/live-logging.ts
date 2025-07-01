import net from 'node:net'
import { networkInterfaces } from 'node:os'
import { type PeerCertificate } from 'node:tls'
import { inspect } from 'node:util'

import { bgBlue, bgCyan, bgGray, bgGreen, bgRed, bgYellow, black } from './colors.js'
import { type EventFormat, LiveLogMessage } from './sse-io.js'
import { fatalError } from './util.js'


export const logLevels = {
	trace: { value: 100, color: bgGreen },
	debug: { value: 200, color: bgCyan },
	info: { value: 300, color: bgBlue },
	warn: { value: 400, color: bgYellow },
	error: { value: 500, color: bgRed },
	fatal: { value: 600, color: bgRed },
	print: { value: 1000, color: bgGray },
} as const
export type LogLevel = keyof typeof logLevels

export type DriverInfo = {
	/**
	 * A UUID for this driver
	 * */
	driver_id: string

	/**
	 * The human readable name of this driver
	 * */
	driver_name: string

	/**
	 * If installed, the sha256 hash of the archive that was downloaded
	 * */
	archive_hash?: string | null

	/**
	 * The current status of this driver
	 * */
	status: string
}

const levelInfoByLogLevelNumber = Object.fromEntries(
	Object.entries(logLevels).map(([name, info]) => [info.value, { name, info }]),
)
// Get the log level named with coloring decorations for terminal output.
const formattedLevelName = (level: number): string => {
	const levelInfo = levelInfoByLogLevelNumber[level]
	const colorString = levelInfo.info.color(levelInfo.name.toUpperCase())

	// black text seems to provide better contrast in most terminals
	return black(colorString)
}

export const liveLogMessageFormatter = (event: LiveLogMessage): EventFormat => {
	const formatString = `${formattedLevelName(event.log_level)} ${event.driver_name}  ${event.message}`
	const time = event.timestamp

	return { formatString, time }
}

export const parseIpAndPort = (address: string): [string, string | undefined] => {
	const items = address.split(':')
	if (items.length > 2) {
		return fatalError('Invalid IPv4 address and port format.')
	}

	if (!net.isIPv4(items[0])) {
		return fatalError('Invalid IPv4 address format.')
	}

	const ipv4 = items[0]
	if (items.length == 1) {
		return [ipv4, undefined]
	}

	const port = Number(items[1])
	if (Number.isInteger(port) && port >= 0 && port <= 65535) {
		return [ipv4, port.toString()]
	}

	return fatalError('Invalid port format.')
}

export const handleConnectionErrors = (authority: string, error: string): never | void => {
	const generalMessage = 'Ensure hub address is correct and try again'

	if (error.includes('ECONNREFUSED') || error.includes('EHOSTUNREACH')) {
		throw Error(`Unable to connect to ${authority}. ${generalMessage}`)
	}
	if (error.includes('ETIMEDOUT')) {
		throw Error(`Connection to ${authority} timed out. ${generalMessage}`)
	}
	if (error.includes('EHOSTDOWN')) {
		throw Error(`The host at ${authority} is down. ${generalMessage}`)
	}
}

export const networkEnvironmentInfo = (): string => inspect(networkInterfaces())

export const scrubAuthInfo = (obj: object): string => {
	const message = inspect(obj)
	const bearerRegex = /(Bearer [0-9a-f]{8})[0-9a-f-]{28}/i

	if (bearerRegex.test(message)) {
		return message.replace(bearerRegex, '$1-xxxx-xxxx-xxxx-xxxxxxxxxxxx')
	} else { // assume there is some other auth format and redact the entire header value
		const authHeaderRegex = /Authorization:\s*(.*)/i
		return message.replace(authHeaderRegex, 'Authorization: (redacted)')
	}
}

/**
 * Expected to manually verify the connected host (similar to overriding tls.checkServerIdentity)
 * by means that LiveLogClient isn't aware of ahead of time.
 */
export type HostVerifier = (cert: PeerCertificate) => Promise<void | never>
