import { jest } from '@jest/globals'

import type { networkInterfaces } from 'node:os'
import type { inspect } from 'node:util'
import type { PeerCertificate, TLSSocket } from 'node:tls'

import type axios from 'axios'
import { AxiosError } from 'axios'
import stripAnsi from 'strip-ansi'

import type { Authenticator } from '@smartthings/core-sdk'

import type { HostVerifier, DriverInfo, LiveLogClientConfig } from '../../lib/live-logging.js'
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

const { debugMock, getLoggerMock, isDebugEnabledMock } = await import('../test-lib/logger-mock.js')

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
	newLiveLogClient,
	parseIpAndPort,
} = await import('../../lib/live-logging.js')


/* eslint-disable @typescript-eslint/naming-convention */
describe('liveLogMessageFormatter', () => {
	const errorEvent: LiveLogMessage = {
		timestamp: 'event timestamp',
		driver_id: 'driver-id',
		driver_name: 'Driver',
		log_level: logLevels.error.value,
		message: 'Something bad happened.',
	}

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

describe('newLiveLogClient', () => {
	const authority = '192.168.222.1:9495'
	const authHeaders = { 'Auth-Header': 'header-value' }
	const authenticateMock = jest.fn<Authenticator['authenticate']>().mockResolvedValue(authHeaders)
	const authenticatorMock = { authenticate: authenticateMock } as unknown as Authenticator
	const baseConfig: LiveLogClientConfig = {
		authority,
		authenticator: authenticatorMock,
		timeout: 1000,
		userAgent: 'user-agent',
	}

	const driver1: DriverInfo = { driver_id: 'driver-id-1', driver_name: 'Driver 1', status: 'some-status' }
	const driver2: DriverInfo = { driver_id: 'driver-id-2', driver_name: 'Driver 2', status: 'other-status' }
	const hubDriverList = [driver1, driver2]
	const certificate = { valid_from: 'yesterday about 3 a.m.' } as PeerCertificate

	it('generates populated LiveLogClient', () => {
		expect(newLiveLogClient(baseConfig)).toStrictEqual({
			getDrivers: expect.any(Function),
			getLogSource: expect.any(Function),
		})

		expect(getLoggerMock).toHaveBeenCalledExactlyOnceWith('cli')
	})

	describe('getDrivers', () => {
		it('returns driver list', async () => {
			const client = newLiveLogClient(baseConfig)
			requestMock.mockResolvedValueOnce({ data: hubDriverList })

			expect(await client.getDrivers()).toBe(hubDriverList)

			expect(authenticateMock).toHaveBeenCalledExactlyOnceWith()

			expect(requestMock).toHaveBeenCalledExactlyOnceWith({
				url: 'https://192.168.222.1:9495/drivers',
				method: 'GET',
				httpsAgent: expect.anything(), // TODO
				timeout: 1000,
				headers: { 'User-Agent': 'user-agent', ...authHeaders },
				transitional: {
					silentJSONParsing: true,
					forcedJSONParsing: true,
					clarifyTimeoutError: true,
				},
			})

			expect(isDebugEnabledMock).not.toHaveBeenCalled()
			expect(debugMock).not.toHaveBeenCalled()
		})

		it('verifies once an only once', async () => {
			const verifierMock = jest.fn<HostVerifier>()
			const config = { ...baseConfig, verifier: verifierMock }
			const client = newLiveLogClient(config)
			const getPeerCertificateMock = jest.fn<typeof TLSSocket.prototype.getPeerCertificate>().mockReturnValue(certificate)
			requestMock.mockResolvedValue({ data: hubDriverList, request: { socket: { getPeerCertificate: getPeerCertificateMock } } })

			expect(await client.getDrivers()).toBe(hubDriverList)
			expect(verifierMock).toHaveBeenCalledExactlyOnceWith(certificate)
			expect(getPeerCertificateMock).toHaveBeenCalledExactlyOnceWith()
			expect(requestMock).toHaveBeenCalledTimes(1)

			// Still once even though another request has been made!
			expect(await client.getDrivers()).toBe(hubDriverList)
			expect(verifierMock).toHaveBeenCalledExactlyOnceWith(certificate)
			expect(getPeerCertificateMock).toHaveBeenCalledExactlyOnceWith()
			expect(requestMock).toHaveBeenCalledTimes(2)
		})

		it.each([
			{ code: 'ECONNREFUSED', message: 'Unable to connect to 192.168.222.1:9495' },
			{ code: 'EHOSTUNREACH', message: 'Unable to connect to 192.168.222.1:9495' },
			{ code: 'ETIMEDOUT', message: 'Connection to 192.168.222.1:9495 timed out' },
			{ code: 'EHOSTDOWN', message: 'The host at 192.168.222.1:9495 is down' },
		])('handles %s axios error with user facing message', async ({ code, message }) => {
			const axiosError = { code, isAxiosError: true } as AxiosError
			const client = newLiveLogClient(baseConfig)
			requestMock.mockRejectedValueOnce(axiosError)

			await expect(client.getDrivers()).rejects.toThrow(`${message}. Ensure hub address is correct and try again`)
		})

		const jsonError = {
			request: {
				headers: {
					Authorization: 'Bearer 8a25775d-0e67-4dce-bbc9-0601ba6589ca',
				},
			},
		}
		it('logs axios error at debug level, scrubbing auth token', async () => {
			isDebugEnabledMock.mockReturnValueOnce(true)
			const toJSONMock = jest.fn<typeof AxiosError.prototype.toJSON>().mockReturnValue(jsonError)
			const axiosError = { code: 'ECONNREFUSED', isAxiosError: true } as AxiosError
			axiosError.toJSON = toJSONMock
			const client = newLiveLogClient(baseConfig)
			requestMock.mockRejectedValueOnce(axiosError)
			inspectMock.mockReturnValueOnce('inspected axios.toJSON Bearer 8a25775d-0e67-4dce-bbc9-0601ba6589ca')
			inspectMock.mockReturnValueOnce('inspected network interfaces')

			await expect(client.getDrivers()).rejects.toThrow()

			expect(isDebugEnabledMock).toHaveBeenCalledExactlyOnceWith()
			expect(inspectMock).toHaveBeenCalledTimes(2)
			expect(inspectMock).toHaveBeenCalledWith(jsonError)
			expect(inspectMock).toHaveBeenCalledWith(interfaces)
			expect(debugMock).toHaveBeenCalledWith('Error connecting to live-logging: inspected axios.toJSON' +
				' Bearer 8a25775d-xxxx-xxxx-xxxx-xxxxxxxxxxxx\n\n' +
				'Local network interfaces: inspected network interfaces')
		})

		it('scrubs alternate auth token format', async () => {
			isDebugEnabledMock.mockReturnValueOnce(true)
			const toJSONMock = jest.fn<typeof AxiosError.prototype.toJSON>().mockReturnValue(jsonError)
			const axiosError = { code: 'ECONNREFUSED', isAxiosError: true } as AxiosError
			axiosError.toJSON = toJSONMock
			const client = newLiveLogClient(baseConfig)
			requestMock.mockRejectedValueOnce(axiosError)
			inspectMock.mockReturnValueOnce('inspected axios.toJSON Authorization: some-other-token-format')
			inspectMock.mockReturnValueOnce('inspected network interfaces')

			await expect(client.getDrivers()).rejects.toThrow()

			expect(isDebugEnabledMock).toHaveBeenCalledExactlyOnceWith()
			expect(inspectMock).toHaveBeenCalledTimes(2)
			expect(inspectMock).toHaveBeenCalledWith(jsonError)
			expect(inspectMock).toHaveBeenCalledWith(interfaces)
			expect(debugMock).toHaveBeenCalledWith('Error connecting to live-logging: inspected axios.toJSON' +
				' Authorization: (redacted)\n\n' +
				'Local network interfaces: inspected network interfaces')
		})

		it('rethrows non-axios errors unchanged', async () => {
			const error = Error('other error')
			const client = newLiveLogClient(baseConfig)
			requestMock.mockRejectedValueOnce(error)

			await expect(client.getDrivers()).rejects.toThrow(error)
		})
	})

	describe('getLogSource', () => {
		const client = newLiveLogClient(baseConfig)

		it('returns URL with no query parameters for all drivers', () => {
			expect(client.getLogSource()).toBe('https://192.168.222.1:9495/drivers/logs')
		})

		it('includes query parameter for a specific driver', () => {
			expect(client.getLogSource('my-driver-id'))
				.toBe('https://192.168.222.1:9495/drivers/logs?driver_id=my-driver-id')
		})
	})
})
/* eslint-enable @typescript-eslint/naming-convention */
