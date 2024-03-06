import { jest } from '@jest/globals'

import { chmod, mkdirSync, NoParamCallback, PathLike, readFileSync, writeFileSync } from 'fs'

import axios, { AxiosResponse } from 'axios'
import express, { Express, Request, Response } from 'express'
import { getPort } from 'get-port-please'
import open from 'open'
import ora, { Ora } from 'ora'

import { Authenticator } from '@smartthings/core-sdk'

import { delay } from '../../lib/util.js'
import { Server } from 'http'


const chmodMock = jest.fn<typeof chmod>()
const mkdirSyncMock = jest.fn<typeof mkdirSync>()
const readFileSyncMock = jest.fn<typeof readFileSync>()
const writeFileSyncMock = jest.fn<typeof writeFileSync>()
jest.unstable_mockModule('fs', () => ({
	chmod: chmodMock,
	mkdirSync: mkdirSyncMock,
	readFileSync: readFileSyncMock,
	writeFileSync: writeFileSyncMock,
}))

const expressMock = jest.fn<typeof express>()
jest.unstable_mockModule('express', () => ({ default: expressMock }))

const getPortMock = jest.fn<typeof getPort>()
jest.unstable_mockModule('get-port-please', () => ({
	getPort: getPortMock,
}))

const { debugMock, errorMock, traceMock } = await import('../test-lib/logger-mock.js')

const openMock = jest.fn<typeof open>()
jest.unstable_mockModule('open', () => ({ default: openMock }))

const oraMock = jest.fn<typeof ora>()
jest.unstable_mockModule('ora', () => ({ default: oraMock }))

const postMock = jest.fn<typeof axios.post>()
jest.unstable_mockModule('axios', () => ({
	default: {
		post: postMock,
	},
}))

const delayMock = jest.fn<typeof delay>()
delayMock.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 5)))
jest.unstable_mockModule('../../lib/util.js', () => ({
	delay: delayMock,
}))


const { loginAuthenticator } = await import('../../lib/login-authenticator.js')


const credentialsFilename = '/full/path/to/file/credentials.json'
const profileName = 'myProfile'
const clientIdProvider = {
	baseURL: 'https://example.com/unused-here',
	authURL: 'https://example.com/unused-here',
	keyApiURL: 'https://example.com/unused-here',
	baseOAuthInURL: 'https://example.com/oauth-in-url',
	oauthAuthTokenRefreshURL: 'https://example.com/refresh-url',
	clientId: 'client-id',
}
const userAgent = 'userAgent'
const accessToken = 'db3d92f1-0000-0000-0000-000000000000'
const refreshToken = '3f3fb859-0000-0000-0000-000000000000'
const credentialsFileData = {
	[profileName]: {
		accessToken: accessToken,
		refreshToken: refreshToken,
		expires: '2020-10-15T13:26:39.966Z',
		scope: 'controller:stCli',
		installedAppId: 'installed app id',
		deviceId: 'device id',
	},
}
const otherCredentialsFileData = {
	other: {
		accessToken: 'other access token',
		refreshToken: 'other refresh token',
		expires: '2021-07-15T22:33:44.123Z',
		scope: 'controller:stCli',
		installedAppId: 'installed app id',
		deviceId: 'device id',
	},
}
const refreshableCredentialsFileData = {
	[profileName]: {
		...credentialsFileData[profileName],
		expires: new Date().toISOString(),
	},
}
const codeVerifierRegex = /\bcode_verifier=[\w|-]+\b/
type AuthTokenResponse = {
	/* eslint-disable @typescript-eslint/naming-convention */
	access_token: string
	refresh_token: string
	expires_in: number
	scope: string
	installed_app_id: string
	device_id: string
	/* eslint-enable @typescript-eslint/naming-convention */
}
const tokenResponse = {
	data: {
		/* eslint-disable @typescript-eslint/naming-convention */
		access_token: 'access token',
		refresh_token: 'refresh token',
		expires_in: 24 * 3600,
		scope: 'scope list',
		installed_app_id: 'installed app id',
		device_id: 'device id',
		/* eslint-enable @typescript-eslint/naming-convention */
	},
	status: 200,
	statusText: 'OK',
} as AxiosResponse<AuthTokenResponse>

const serverCloseMock = jest.fn<Server['close']>()
const serverMock = {
	close: serverCloseMock,
} as unknown as Server

const expressGetMock = jest.fn<Express['get']>()
const expressListenMock = jest.fn<Express['listen']>()
expressMock.mockReturnValue({
	get: expressGetMock,
	listen: expressListenMock,
} as unknown as Express)
expressListenMock.mockReturnValue(serverMock)

const mockStartResponse = {
	redirect: jest.fn(),
}
const mockFinishRequest = {
	query: { code: 'auth-code' },
}
const mockFinishResponse = {
	send: jest.fn(),
}

readFileSyncMock.mockImplementation(() => { throw { code: 'ENOENT' } })
getPortMock.mockResolvedValue(7777)
postMock.mockResolvedValue(tokenResponse)

const spinnerStartMock = jest.fn()
const spinnerSucceedMock = jest.fn()
const spinnerFailMock = jest.fn()
const spinnerMock = {
	start: spinnerStartMock,
	succeed: spinnerSucceedMock,
	fail: spinnerFailMock,
} as unknown as Ora
oraMock.mockReturnValue(spinnerMock)

const setupAuthenticator = (): Authenticator =>
	loginAuthenticator(credentialsFilename, profileName, clientIdProvider, userAgent)

type ExpressRouteHandler = (request: Request, response: Response) => void
const finishHappy = (finishHandler: ExpressRouteHandler): void =>
	finishHandler(mockFinishRequest as unknown as Request, mockFinishResponse as unknown as Response)
// Call handlers like would happen if the user were following the flow in the browser.
const mockBrowser = async (finishHandlerCaller = finishHappy, closeError?: Error): Promise<void> => {
	async function testDelay(milliseconds: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, milliseconds).unref())
	}

	while (expressGetMock.mock.calls.length < 2) {
		await testDelay(5)
	}
	const startHandler = expressGetMock.mock.calls[0][1] as ExpressRouteHandler
	const finishHandler = expressGetMock.mock.calls[1][1] as ExpressRouteHandler

	startHandler({} as Request, mockStartResponse as unknown as Response)
	finishHandlerCaller(finishHandler)

	while (serverCloseMock.mock.calls.length < 1) {
		await testDelay(10)
	}
	const closeHandler = serverCloseMock.mock.calls[0][0] as (error?: Error) => void
	closeHandler(closeError)
}

describe('loginAuthenticator', () => {
	it('creates Authenticator without errors', () => {
		expect(loginAuthenticator(credentialsFilename, profileName, clientIdProvider, userAgent)).toBeDefined()
	})

	it('makes sure directories exist', () => {
		expect(loginAuthenticator(credentialsFilename, profileName, clientIdProvider, userAgent)).toBeDefined()

		expect(mkdirSyncMock).toHaveBeenCalledTimes(1)
		expect(mkdirSyncMock).toHaveBeenCalledWith('/full/path/to/file', { recursive: true })
	})

	it('reads auth from credentials file', () => {
		readFileSyncMock.mockReturnValueOnce(Buffer.from(JSON.stringify(credentialsFileData)))

		expect(loginAuthenticator(credentialsFilename, profileName, clientIdProvider, userAgent)).toBeDefined()

		expect(traceMock).toHaveBeenCalledWith('constructing a LoginAuthenticator')
		expect(traceMock).toHaveBeenCalledWith(expect.stringContaining('authentication info from file'))
		expect(readFileSyncMock).toHaveBeenCalledWith(credentialsFilename)
	})

	it('partially redacts token values in logs', async () => {
		readFileSyncMock.mockReturnValueOnce(Buffer.from(JSON.stringify(credentialsFileData)))

		expect(loginAuthenticator(credentialsFilename, profileName, clientIdProvider, userAgent)).toBeDefined()

		expect(traceMock).not.toHaveBeenCalledWith(expect.stringContaining(accessToken))
		expect(traceMock).not.toHaveBeenCalledWith(expect.stringContaining(refreshToken))
		expect(traceMock).toHaveBeenCalledWith(expect.stringContaining('db3d92f1'))
		expect(traceMock).toHaveBeenCalledWith(expect.stringContaining('3f3fb859'))
	})

	it('re-throws non-end-of-file error reading file', async () => {
		readFileSyncMock.mockImplementationOnce(() => { throw Error('not an end-of-file error') })

		expect(() => loginAuthenticator(credentialsFilename, profileName, clientIdProvider, userAgent))
			.toThrow('not an end-of-file error')
	})
})

describe('login', () => {
	it('works on the happy path', async () => {
		const authenticator = setupAuthenticator()

		const loginPromise = authenticator.login?.()

		await mockBrowser()
		await loginPromise

		expect(expressMock).toHaveBeenCalledTimes(1)
		expect(expressMock).toHaveBeenCalledWith()

		expect(getPortMock).toHaveBeenCalledTimes(1)
		expect(getPortMock).toHaveBeenCalledWith({ ports: [61973, 61974, 61975] })

		expect(oraMock).toHaveBeenCalledTimes(1)
		expect(oraMock).toHaveBeenCalledWith('Logging In')

		expect(expressGetMock).toHaveBeenCalledTimes(2)
		expect(expressGetMock).toHaveBeenCalledWith('/start', expect.any(Function))
		expect(expressGetMock).toHaveBeenCalledWith('/finish', expect.any(Function))

		expect(spinnerSucceedMock).toHaveBeenCalledTimes(1)
		expect(spinnerSucceedMock).toHaveBeenCalledWith()

		expect(expressListenMock).toHaveBeenCalledTimes(1)
		expect(expressListenMock).toHaveBeenCalledWith(7777, expect.any(Function))
		const listenHandler = expressListenMock.mock.calls[0][1] as () => Promise<void>
		await listenHandler()
		expect(spinnerStartMock).toHaveBeenCalledTimes(1)
		expect(spinnerStartMock).toHaveBeenCalledWith()
		expect(openMock).toHaveBeenCalledTimes(1)
		expect(openMock).toHaveBeenCalledWith('http://localhost:7777/start')

		expect(mockStartResponse.redirect).toHaveBeenCalledTimes(1)

		expect(postMock).toHaveBeenCalledTimes(1)
		expect(postMock).toHaveBeenCalledWith('https://example.com/oauth-in-url/token', expect.anything(), expect.anything())
		const postData = postMock.mock.calls[0][1]
		expect(postData).toMatch(/\bgrant_type=authorization_code\b/)
		expect(postData).toMatch(/\bclient_id=client-id\b/)
		expect(postData).toMatch(codeVerifierRegex)
		expect(postData).toMatch(/\bcode=auth-code\b/)
		expect(postData).toMatch(/\bredirect_uri=http%3A%2F%2Flocalhost%3A7777%2Ffinish\b/)
		const postConfig = postMock.mock.calls[0][2]
		expect(postConfig?.headers?.['Content-Type']).toBe('application/x-www-form-urlencoded')

		expect(mockFinishResponse.send).toHaveBeenCalledTimes(1)
		expect(mockFinishResponse.send).toHaveBeenCalledWith(expect.stringContaining('You can close the window.'))

		expect(readFileSyncMock).toHaveBeenCalledTimes(2)
		expect(readFileSyncMock).toHaveBeenCalledWith(credentialsFilename)
		expect(writeFileSyncMock).toHaveBeenCalledTimes(1)
		expect(writeFileSyncMock).toHaveBeenCalledWith(credentialsFilename, expect.stringMatching(/"myProfile":/))
		expect(chmodMock).toHaveBeenCalledTimes(1)
		expect(chmodMock).toHaveBeenCalledWith(credentialsFilename, 0o600, expect.any(Function))

		expect(spinnerFailMock).toHaveBeenCalledTimes(0)
	})

	it('includes User-Agent in requests', async () => {
		const authenticator = setupAuthenticator()
		const loginPromise = authenticator.login?.()

		await mockBrowser()
		await loginPromise

		expect(postMock).toHaveBeenCalledTimes(1)
		expect(postMock).toHaveBeenCalledWith(
			'https://example.com/oauth-in-url/token',
			expect.any(String),
			expect.anything(),
		)

		const postConfig = postMock.mock.calls[0][2]
		expect(postConfig?.headers).toContainEntry(['User-Agent', userAgent])
	})

	it('logs error if setting permissions of credentials file fails', async () => {
		const error = Error('failed to chmod')
		chmodMock.mockImplementationOnce(((path: PathLike, mode: string | number, callback: NoParamCallback): void => {
			callback(error)
		}) as typeof chmod)
		const authenticator = setupAuthenticator()

		const loginPromise = authenticator.login?.()

		await mockBrowser()
		await loginPromise

		expect(chmodMock).toHaveBeenCalledTimes(1)
		expect(chmodMock).toHaveBeenCalledWith(credentialsFilename, 0o600, expect.any(Function))
		expect(errorMock).toHaveBeenCalledWith('failed to set permissions on credentials file', error)
	})

	it('reports error when authentication fails', async () => {
		readFileSyncMock.mockReturnValueOnce(Buffer.from(JSON.stringify(credentialsFileData)))
		const authenticator = setupAuthenticator()

		const loginPromise = authenticator.login?.()

		const mockFinishRequest = {
			query: {
				error: 'could not get code',
				// eslint-disable-next-line @typescript-eslint/naming-convention
				error_description: 'because of reasons',
			},
		}
		const finishWithError = (finishHandler: ExpressRouteHandler): void =>
			finishHandler(mockFinishRequest as unknown as Request, mockFinishResponse as unknown as Response)

		await mockBrowser(finishWithError)
		await expect(loginPromise).rejects.toBe('unable to get authentication info')

		expect(expressGetMock).toHaveBeenCalledTimes(2)
		expect(expressGetMock).toHaveBeenCalledWith('/start', expect.any(Function))
		expect(expressGetMock).toHaveBeenCalledWith('/finish', expect.any(Function))

		expect(spinnerFailMock).toHaveBeenCalledTimes(1)
		expect(spinnerFailMock).toHaveBeenCalledWith()

		expect(expressListenMock).toHaveBeenCalledTimes(1)
		expect(expressListenMock).toHaveBeenCalledWith(7777, expect.any(Function))
		const listenHandler = expressListenMock.mock.calls[0][1]
		listenHandler?.()
		expect(openMock).toHaveBeenCalledTimes(1)
		expect(openMock).toHaveBeenCalledWith('http://localhost:7777/start')

		expect(mockStartResponse.redirect).toHaveBeenCalledTimes(1)

		expect(postMock).toHaveBeenCalledTimes(0)

		expect(mockFinishResponse.send).toHaveBeenCalledTimes(1)
		expect(mockFinishResponse.send).toHaveBeenCalledWith(expect.stringContaining('Failure trying to authenticate.'))

		expect(readFileSyncMock).toHaveBeenCalledTimes(1)
		expect(writeFileSyncMock).toHaveBeenCalledTimes(0)
		expect(chmodMock).toHaveBeenCalledTimes(0)
	})

	it('reports error when token request fails', async () => {
		readFileSyncMock.mockReturnValueOnce(Buffer.from(JSON.stringify(credentialsFileData)))
		postMock.mockRejectedValueOnce({ name: 'forced error', message: 'forced failure' })
		const authenticator = setupAuthenticator()

		const loginPromise = authenticator.login?.()

		await mockBrowser()
		await expect(loginPromise).rejects.toBe('unable to get authentication info')

		expect(expressGetMock).toHaveBeenCalledTimes(2)
		expect(expressGetMock).toHaveBeenCalledWith('/start', expect.any(Function))
		expect(expressGetMock).toHaveBeenCalledWith('/finish', expect.any(Function))

		expect(expressListenMock).toHaveBeenCalledTimes(1)
		expect(expressListenMock).toHaveBeenCalledWith(7777, expect.any(Function))
		const listenHandler = expressListenMock.mock.calls[0][1]
		listenHandler?.()
		expect(openMock).toHaveBeenCalledTimes(1)
		expect(openMock).toHaveBeenCalledWith('http://localhost:7777/start')

		expect(mockStartResponse.redirect).toHaveBeenCalledTimes(1)

		expect(postMock).toHaveBeenCalledTimes(1)
		expect(postMock).toHaveBeenCalledWith('https://example.com/oauth-in-url/token', expect.anything(), expect.anything())
		const postData = postMock.mock.calls[0][1]
		expect(postData).toMatch(/\bgrant_type=authorization_code\b/)
		expect(postData).toMatch(/\bclient_id=client-id\b/)
		expect(postData).toMatch(codeVerifierRegex)
		expect(postData).toMatch(/\bcode=auth-code\b/)
		expect(postData).toMatch(/\bredirect_uri=http%3A%2F%2Flocalhost%3A7777%2Ffinish\b/)
		const postConfig = postMock.mock.calls[0][2]
		expect(postConfig?.headers?.['Content-Type']).toBe('application/x-www-form-urlencoded')

		expect(mockFinishResponse.send).toHaveBeenCalledTimes(1)
		expect(mockFinishResponse.send).toHaveBeenCalledWith(expect.stringContaining('Failure obtaining access token.'))

		expect(readFileSyncMock).toHaveBeenCalledTimes(1)
		expect(writeFileSyncMock).toHaveBeenCalledTimes(0)
		expect(chmodMock).toHaveBeenCalledTimes(0)
	})

	it('logs axios response data', async () => {
		readFileSyncMock.mockReturnValueOnce(Buffer.from(JSON.stringify(credentialsFileData)))
		postMock.mockRejectedValueOnce({ isAxiosError: true, response: { data: 'axios error data' } })
		const authenticator = setupAuthenticator()

		const loginPromise = authenticator.login?.()

		await mockBrowser()
		await expect(loginPromise).rejects.toBe('unable to get authentication info')

		expect(errorMock).toHaveBeenCalledWith('axios error data')
	})

	it('logs express server close error', async () => {
		readFileSyncMock.mockReturnValueOnce(Buffer.from(JSON.stringify(credentialsFileData)))
		const closeError = Error('express close error')
		const authenticator = setupAuthenticator()

		const loginPromise = authenticator.login?.()

		await mockBrowser(finishHappy, closeError)
		await loginPromise

		expect(errorMock).toHaveBeenCalledWith('error closing express server', closeError)
	})
})

describe('logout', () => {
	it('works on the happy path', async () => {
		readFileSyncMock.mockReturnValue(Buffer.from(JSON.stringify(credentialsFileData)))
		const authenticator = setupAuthenticator()

		await expect(authenticator.logout?.()).resolves.toBe(undefined)

		expect(readFileSyncMock).toHaveBeenCalledTimes(2)
		expect(writeFileSyncMock).toHaveBeenCalledTimes(1)
		expect(writeFileSyncMock).toHaveBeenCalledWith(credentialsFilename, '{}')
	})

	it('is fine when there is no profile to delete', async () => {
		readFileSyncMock.mockReturnValue(Buffer.from(JSON.stringify(otherCredentialsFileData)))
		const authenticator = setupAuthenticator()

		await expect(authenticator.logout?.()).resolves.toBe(undefined)

		expect(readFileSyncMock).toHaveBeenCalledTimes(2)
		expect(writeFileSyncMock).toHaveBeenCalledTimes(1)
		expect(writeFileSyncMock).toHaveBeenCalledWith(credentialsFilename, JSON.stringify(otherCredentialsFileData, null, 4))
	})
})

describe('authenticate', () => {
	it('calls generic authenticate', async () => {
		readFileSyncMock.mockReturnValueOnce(Buffer.from(JSON.stringify(credentialsFileData)))

		const authenticator = setupAuthenticator()

		const requestConfig = {}

		const response = await authenticator.authenticate(requestConfig)

		expect(response.headers?.Authorization).toEqual('Bearer access token')
		expect(debugMock).toHaveBeenCalledWith('authentication - enter')
	})
})

describe('authenticateGeneric', () => {
	it('refreshes token when necessary', async () => {
		readFileSyncMock.mockReturnValueOnce(Buffer.from(JSON.stringify(refreshableCredentialsFileData)))

		const authenticator = setupAuthenticator()

		const response = await authenticator.authenticate({})

		expect(response.headers?.Authorization).toEqual('Bearer access token')

		expect(postMock).toHaveBeenCalledTimes(1)
		const postData = postMock.mock.calls[0][1]
		expect(postData).toMatch(/\bgrant_type=refresh_token\b/)
		expect(postData).toMatch(/\bclient_id=client-id\b/)
		expect(postData).toEqual(expect.stringContaining(`refresh_token=${refreshToken}`))
		const postConfig = postMock.mock.calls[0][2]
		expect(postConfig?.headers?.['Content-Type']).toBe('application/x-www-form-urlencoded')

		expect(readFileSyncMock).toHaveBeenCalledTimes(2)
		expect(readFileSyncMock).toHaveBeenCalledWith(credentialsFilename)
		expect(writeFileSyncMock).toHaveBeenCalledTimes(1)
		expect(writeFileSyncMock).toHaveBeenCalledWith(credentialsFilename, expect.stringMatching(/"myProfile":/))
	})

	it('includes User-Agent on refresh', async () => {
		readFileSyncMock.mockReturnValueOnce(Buffer.from(JSON.stringify(refreshableCredentialsFileData)))
		const authenticator = setupAuthenticator()

		await authenticator.authenticate({})

		expect(postMock).toHaveBeenCalledTimes(1)
		expect(postMock).toHaveBeenCalledWith(
			clientIdProvider.oauthAuthTokenRefreshURL,
			expect.any(String),
			expect.anything(),
		)

		const postConfig = postMock.mock.calls[0][2]
		expect(postConfig?.headers).toContainEntry(['User-Agent', userAgent])
	})

	it('logs in when refresh fails', async () => {
		readFileSyncMock.mockReturnValueOnce(Buffer.from(JSON.stringify(refreshableCredentialsFileData)))
		postMock.mockRejectedValueOnce(Error('forced failure'))
		postMock.mockResolvedValueOnce(tokenResponse)

		const authenticator = setupAuthenticator()

		const promise = authenticator.authenticate({})
		await mockBrowser()
		const response = await promise

		expect(response.headers?.Authorization).toEqual('Bearer access token')

		expect(postMock).toHaveBeenCalledTimes(2)
		const postData = postMock.mock.calls[0][1]
		expect(postData).toMatch(/\bgrant_type=refresh_token\b/)
		expect(postData).toMatch(/\bclient_id=client-id\b/)
		expect(postData).toEqual(expect.stringContaining(`refresh_token=${refreshToken}`))
		const postConfig = postMock.mock.calls[0][2]
		expect(postConfig?.headers?.['Content-Type']).toBe('application/x-www-form-urlencoded')
		expect(postMock).toHaveBeenCalledWith('https://example.com/oauth-in-url/token', expect.anything(), expect.anything())
		const postData2 = postMock.mock.calls[1][1]
		expect(postData2).toMatch(/\bgrant_type=authorization_code\b/)
		expect(postData2).toMatch(/\bclient_id=client-id\b/)
		expect(postData2).toMatch(codeVerifierRegex)
		expect(postData2).toMatch(/\bcode=auth-code\b/)
		expect(postData2).toMatch(/\bredirect_uri=http%3A%2F%2Flocalhost%3A7777%2Ffinish\b/)
		const postConfig2 = postMock.mock.calls[1][2]
		expect(postConfig2?.headers?.['Content-Type']).toBe('application/x-www-form-urlencoded')

		expect(mockFinishResponse.send).toHaveBeenCalledTimes(1)
		expect(mockFinishResponse.send).toHaveBeenCalledWith(expect.stringContaining('You can close the window.'))

		expect(readFileSyncMock).toHaveBeenCalledTimes(2)
		expect(readFileSyncMock).toHaveBeenCalledWith(credentialsFilename)
		expect(writeFileSyncMock).toHaveBeenCalledTimes(1)
		expect(writeFileSyncMock).toHaveBeenCalledWith(credentialsFilename, expect.stringMatching(/"myProfile":/))
	})

	it('logs in not logged in', async () => {
		const authenticator = setupAuthenticator()

		const promise = authenticator.authenticate({})
		await mockBrowser()
		const response = await promise

		expect(response.headers?.Authorization).toEqual('Bearer access token')

		expect(getPortMock).toHaveBeenCalledTimes(1)
		expect(getPortMock).toHaveBeenCalledWith({ ports: [61973, 61974, 61975] })

		expect(expressGetMock).toHaveBeenCalledTimes(2)
		expect(expressGetMock).toHaveBeenCalledWith('/start', expect.any(Function))
		expect(expressGetMock).toHaveBeenCalledWith('/finish', expect.any(Function))

		expect(expressListenMock).toHaveBeenCalledTimes(1)
		expect(expressListenMock).toHaveBeenCalledWith(7777, expect.any(Function))
		const listenHandler = expressListenMock.mock.calls[0][1]
		listenHandler?.()
		expect(openMock).toHaveBeenCalledTimes(1)
		expect(openMock).toHaveBeenCalledWith('http://localhost:7777/start')

		expect(mockStartResponse.redirect).toHaveBeenCalledTimes(1)

		expect(postMock).toHaveBeenCalledTimes(1)
		expect(postMock).toHaveBeenCalledWith('https://example.com/oauth-in-url/token', expect.anything(), expect.anything())
		const postData = postMock.mock.calls[0][1]
		expect(postData).toMatch(/\bgrant_type=authorization_code\b/)
		expect(postData).toMatch(/\bclient_id=client-id\b/)
		expect(postData).toMatch(codeVerifierRegex)
		expect(postData).toMatch(/\bcode=auth-code\b/)
		expect(postData).toMatch(/\bredirect_uri=http%3A%2F%2Flocalhost%3A7777%2Ffinish\b/)
		const postConfig = postMock.mock.calls[0][2]
		expect(postConfig?.headers?.['Content-Type']).toBe('application/x-www-form-urlencoded')

		expect(mockFinishResponse.send).toHaveBeenCalledTimes(1)
		expect(mockFinishResponse.send).toHaveBeenCalledWith(expect.stringContaining('You can close the window.'))

		expect(readFileSyncMock).toHaveBeenCalledTimes(2)
		expect(readFileSyncMock).toHaveBeenCalledWith(credentialsFilename)
		expect(writeFileSyncMock).toHaveBeenCalledTimes(1)
		expect(writeFileSyncMock).toHaveBeenCalledWith(credentialsFilename, expect.stringMatching(/"myProfile":/))
	})

	it('logs errors with trying to refresh token', async () => {
		readFileSyncMock.mockReturnValueOnce(Buffer.from(JSON.stringify(refreshableCredentialsFileData)))
		postMock.mockRejectedValueOnce({
			message: 'token refresh failure',
			isAxiosError: true,
			response: { data: 'axios error data' },
		})

		const authenticator = setupAuthenticator()

		const promise = authenticator.authenticate({})
		await mockBrowser()
		const response = await promise

		expect(response.headers?.Authorization).toEqual('Bearer access token')

		expect(errorMock).toHaveBeenCalledWith('error trying to refresh token:', 'token refresh failure')
	})
})
