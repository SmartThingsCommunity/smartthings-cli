import { jest } from '@jest/globals'

import type { networkInterfaces } from 'node:os'
import type { inspect } from 'node:util'

import type axios from 'axios'
import stripAnsi from 'strip-ansi'

import type { LiveLogMessage } from '../../lib/sse-io.js'
import type { fatalError } from '../../lib/util.js'


const interfaces = { loopback: [] }
const networkInterfacesMock = jest.fn<typeof networkInterfaces>().mockReturnValue(interfaces)
jest.unstable_mockModule('node:os', () => ({
	networkInterfaces: networkInterfacesMock,
	default: {},
}))

const inspectMock = jest.fn<typeof inspect>()
jest.unstable_mockModule('node:util', () => ({
	inspect: inspectMock,
}))

const requestMock = jest.fn<typeof axios.request>()
jest.unstable_mockModule('axios', () => ({
	default: {
		request: requestMock,
	},
}))

const fatalErrorMock = jest.fn<typeof fatalError>().mockReturnValue('never return' as never)
jest.unstable_mockModule('../../lib/util.js', () => ({
	fatalError: fatalErrorMock,
}))


const {
	handleConnectionErrors,
	liveLogMessageFormatter,
	logLevels,
	parseIpAndPort,
} = await import('../../lib/live-logging.js')


describe('liveLogMessageFormatter', () => {
	/* eslint-disable @typescript-eslint/naming-convention */
	const errorEvent: LiveLogMessage = {
		timestamp: 'event timestamp',
		driver_id: 'driver-id',
		driver_name: 'Driver',
		log_level: logLevels.error.value,
		message: 'Something bad happened.',
	}
	/* eslint-enable @typescript-eslint/naming-convention */

	it('returns timestamp in event format', () => {
		const format = liveLogMessageFormatter(errorEvent)
		expect(format.time).toBe(errorEvent.timestamp)
	})

	it('has expected formatString', () => {
		const { formatString, formatArgs, time } = liveLogMessageFormatter(errorEvent)

		expect(stripAnsi(formatString)).toBe(`ERROR ${errorEvent.driver_name}  ${errorEvent.message}`)
		expect(formatArgs).toBeUndefined()
		expect(time).toBe('event timestamp')
	})
})

describe('parseIpAndPort', () => {
	it.each`
		address                | expected
		${'192.168.0.1'}       | ${['192.168.0.1', undefined]}
		${'192.168.0.1:0'}     | ${['192.168.0.1', '0']}
		${'192.168.0.1:1234'}  | ${['192.168.0.1', '1234']}
		${'192.168.0.1:65535'} | ${['192.168.0.1', '65535']}
	`('returns $expected when $address is parsed', ({ address, expected }) => {
		expect(parseIpAndPort(address)).toStrictEqual(expected)
	})

	it.each([
		'192.168.0.1::1234',
		'fe80::af:7f6a:9613:aa15',
		'[fe80::af:7f6a:9613:aa15]:1234',
	])('throws invalid address and port error when %s is parsed', (address) => {
		expect(parseIpAndPort(address)).toBe('never return')

		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith('Invalid IPv4 address and port format.')
	})

	it.each([
		'',
		'123',
		'abc',
	])('throws invalid address error when %s is parsed', (address) => {
		expect(parseIpAndPort(address)).toBe('never return')

		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith('Invalid IPv4 address format.')
	})

	it.each([
		'192.168.0.1:123.4',
		'192.168.0.1:-1',
		'192.168.0.1:abc',
		`192.168.0.1: ${Number.MAX_SAFE_INTEGER + 1}`,
		`192.168.0.1: ${Number.MIN_SAFE_INTEGER - 1}`,
	])('throws invalid port error when %s is parsed', (address) => {
		expect(parseIpAndPort(address)).toBe('never return')

		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith('Invalid port format.')
	})
})

describe('handleConnectionErrors', () => {
	it.each`
		error             | message
		${'ECONNREFUSED'} | ${'Unable to connect'}
		${'EHOSTUNREACH'} | ${'Unable to connect'}
		${'ETIMEDOUT'}    | ${'timed out'}
		${'EHOSTDOWN'}    | ${'192.168.0.1 is down'}
	`('throws $message when $error is handled', ({ error, message }) => {
		expect(() => handleConnectionErrors('192.168.0.1', error)).toThrow(message)
	})

	it.each([
		'ETIME',
		'econnrefused',
		'Unauthorized',
	])('does not throw when %s is handled', (error) => {
		expect(() => handleConnectionErrors('192.168.0.1', error)).not.toThrow()
	})
})
