import fs, { NoParamCallback, PathLike } from 'fs'

import axios, { AxiosResponse } from 'axios'
import express, { Express, Request, Response } from 'express'
import log4js from 'log4js'
import open from 'open'
import ora, { Ora } from 'ora'

import { getPort } from 'get-port-please'
import { LoginAuthenticator } from '../../lib/login-authenticator.js'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const recording = require('log4js/lib/appenders/recording')


jest.mock('fs', () => {
	const originalLib = jest.requireActual('fs')

	return {
		...originalLib,
		mkdirSync: jest.fn(),
		readFileSync: jest.fn(),
		writeFileSync: jest.fn(),
		chmod: jest.fn(),
	}
})

jest.mock('express')
jest.mock('get-port-please')
jest.mock('open', () => jest.fn())
jest.mock('ora', () => jest.fn())
jest.mock('axios')


async function delay(milliseconds: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, milliseconds).unref())
}

describe('LoginAuthenticator', () => {
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
	const config = {
		appenders: {
			main: { type: 'recording' },
			stdout: { type: 'stdout' },
		},
		categories: {
			default: { appenders: ['main'], level: 'ERROR' },
			// eslint-disable-next-line @typescript-eslint/naming-convention
			'login-authenticator': { appenders: ['main'], level: 'TRACE' },
		},
	}
	const accessToken = 'db3d92f1-0000-0000-0000-000000000000'
	const refreshToken = '3f3fb859-0000-0000-0000-000000000000'
	const credentialsFileData = {
		[profileName]: {
			'accessToken': accessToken,
			'refreshToken': refreshToken,
			'expires': '2020-10-15T13:26:39.966Z',
			'scope': 'controller:stCli',
			'installedAppId': 'installed app id',
			'deviceId': 'device id',
		},
	}
	const otherCredentialsFileData = {
		other: {
			'accessToken': 'other access token',
			'refreshToken': 'other refresh token',
			'expires': '2021-07-15T22:33:44.123Z',
			'scope': 'controller:stCli',
			'installedAppId': 'installed app id',
			'deviceId': 'device id',
		},
	}
	const refreshableCredentialsFileData = {
		[profileName]: {
			...credentialsFileData[profileName],
			'expires': new Date().toISOString(),
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

	const mockServer = {
		close: jest.fn(),
	}

	const expressGetMock = jest.fn()
	const expressListenMock = jest.fn()
	const expressMock = {
		get: expressGetMock,
		listen: expressListenMock,
	} as unknown as Express
	const expressFunctionMock = jest.mocked(express).mockReturnValue(expressMock)
	expressListenMock.mockReturnValue(mockServer)

	const mockStartResponse = {
		redirect: jest.fn(),
	}
	const mockFinishRequest = {
		query: { code: 'auth-code' },
	}
	const mockFinishResponse = {
		send: jest.fn(),
	}

	log4js.configure(config)

	const mkdirMock = jest.mocked(fs.mkdirSync)
	const readFileMock = jest.mocked(fs.readFileSync).mockImplementation(() => { throw { code: 'ENOENT' } })
	const writeFileMock = jest.mocked(fs.writeFileSync)
	const chmodMock = jest.mocked(fs.chmod)
	const getPortMock = jest.mocked(getPort).mockResolvedValue(7777)
	const postMock = jest.mocked(axios.post).mockResolvedValue(tokenResponse)

	const spinnerStartMock = jest.fn()
	const spinnerSucceedMock = jest.fn()
	const spinnerFailMock = jest.fn()
	const spinnerMock = {
		start: spinnerStartMock,
		succeed: spinnerSucceedMock,
		fail: spinnerFailMock,
	} as unknown as Ora
	const oraMock = jest.mocked(ora).mockReturnValue(spinnerMock)

	function setupAuthenticator(): LoginAuthenticator {
		LoginAuthenticator.init(credentialsFilename)
		return new LoginAuthenticator(profileName, clientIdProvider, userAgent)
	}

	type ExpressRouteHandler = (request: Request, response: Response) => void
	const finishHappy = (finishHandler: ExpressRouteHandler): void =>
		finishHandler(mockFinishRequest as unknown as Request, mockFinishResponse as unknown as Response)
	// Call handlers like would happen if the user were following the flow in the browser.
	async function imitateBrowser(finishHandlerCaller = finishHappy): Promise<void> {
		while (expressGetMock.mock.calls.length < 2) {
			await delay(25)
		}
		const startHandler: ExpressRouteHandler = expressGetMock.mock.calls[0][1]
		const finishHandler: ExpressRouteHandler = expressGetMock.mock.calls[1][1]

		startHandler({} as Request, mockStartResponse as unknown as Response)
		finishHandlerCaller(finishHandler)

		while (mockServer.close.mock.calls.length < 1) {
			await delay(25)
		}
		const closeHandler: (error?: Error) => void = mockServer.close.mock.calls[0][0]
		closeHandler()
	}

	afterEach(() => {
		delete (globalThis as { _credentialsFile?: string })._credentialsFile
		recording.reset()
	})

	describe('init', () => {
		it('makes sure directories exist', () => {
			LoginAuthenticator.init(credentialsFilename)

			expect(mkdirMock).toHaveBeenCalledTimes(1)
			expect(mkdirMock).toHaveBeenCalledWith('/full/path/to/file', { recursive: true })
		})

		it('sets _credentialsFile properly', function () {
			LoginAuthenticator.init(credentialsFilename)

			expect((global as { _credentialsFile?: string })._credentialsFile).toBe(credentialsFilename)
		})
	})

	describe('constructor', () => {
		it('throws exception when init not called', function () {
			expect(() => new LoginAuthenticator(profileName, clientIdProvider, userAgent))
				.toThrow('LoginAuthenticator credentials file not set.')
		})

		it('constructs without errors', function () {
			LoginAuthenticator.init(credentialsFilename)

			const loginAuthenticator = new LoginAuthenticator(profileName, clientIdProvider, userAgent)

			expect(loginAuthenticator).toBeDefined()
		})

		it('reads auth from credentials file', () => {
			readFileMock.mockReturnValueOnce(Buffer.from(JSON.stringify(credentialsFileData)))
			LoginAuthenticator.init(credentialsFilename)

			const loginAuthenticator = new LoginAuthenticator(profileName, clientIdProvider, userAgent)

			expect(loginAuthenticator).toBeDefined()

			const logs = recording.replay()
			expect(logs.length).toBe(2)
			expect(logs[0].data[0]).toBe('constructing a LoginAuthenticator')
			expect(readFileMock).toBeCalledWith(credentialsFilename)
			expect(logs[1].data[0]).toEqual(expect.stringContaining('authentication info from file'))
		})

		it('partially redacts token values in logs', async () => {
			readFileMock.mockReturnValueOnce(Buffer.from(JSON.stringify(credentialsFileData)))
			LoginAuthenticator.init(credentialsFilename)

			new LoginAuthenticator(profileName, clientIdProvider, userAgent)

			const logs = recording.replay()
			const authInfoLog = logs[1].data[0]
			expect(authInfoLog).not.toIncludeMultiple([accessToken, refreshToken])
			expect(authInfoLog).toIncludeMultiple(['db3d92f1', '3f3fb859'])
		})
	})

	describe('login', () => {
		it('works on the happy path', async () => {
			const loginAuthenticator = setupAuthenticator()

			const loginPromise = loginAuthenticator.login()

			await imitateBrowser()
			await loginPromise

			expect(expressFunctionMock).toHaveBeenCalledTimes(1)
			expect(expressFunctionMock).toHaveBeenCalledWith()

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
			const listenHandler: () => Promise<void> = expressListenMock.mock.calls[0][1]
			await listenHandler()
			expect(spinnerStartMock).toHaveBeenCalledTimes(1)
			expect(spinnerStartMock).toHaveBeenCalledWith()
			expect(open).toHaveBeenCalledTimes(1)
			expect(open).toHaveBeenCalledWith('http://localhost:7777/start')

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

			expect(readFileMock).toHaveBeenCalledTimes(2)
			expect(readFileMock).toHaveBeenCalledWith(credentialsFilename)
			expect(writeFileMock).toHaveBeenCalledTimes(1)
			expect(writeFileMock).toHaveBeenCalledWith(credentialsFilename, expect.stringMatching(/"myProfile":/))
			expect(chmodMock).toHaveBeenCalledTimes(1)
			expect(chmodMock).toHaveBeenCalledWith(credentialsFilename, 0o600, expect.any(Function))

			expect(spinnerFailMock).toHaveBeenCalledTimes(0)
		})

		it('includes User-Agent in requests', async () => {
			const loginAuthenticator = setupAuthenticator()
			const loginPromise = loginAuthenticator.login()

			await imitateBrowser()
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
			chmodMock.mockImplementationOnce((path: PathLike, mode: string | number, callback: NoParamCallback) => {
				callback(Error('failed to chmod'))
			})
			const loginAuthenticator = setupAuthenticator()

			const loginPromise = loginAuthenticator.login()

			await imitateBrowser()
			await loginPromise

			expect(chmodMock).toHaveBeenCalledTimes(1)
			expect(chmodMock).toHaveBeenCalledWith(credentialsFilename, 0o600, expect.any(Function))
			const logs = recording.replay()
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const pertinentLog = logs.filter((log: { data: any[] }) => log.data[0] === 'failed to set permissions on credentials file')
			expect(pertinentLog.length).toBe(1)
		})

		it('reports error when authentication fails', async () => {
			readFileMock.mockReturnValueOnce(Buffer.from(JSON.stringify(credentialsFileData)))
			const loginAuthenticator = setupAuthenticator()

			const loginPromise = loginAuthenticator.login()

			const mockFinishRequest = {
				query: {
					error: 'could not get code',
					// eslint-disable-next-line @typescript-eslint/naming-convention
					error_description: 'because of reasons',
				},
			}
			const finishWithError = (finishHandler: ExpressRouteHandler): void =>
				finishHandler(mockFinishRequest as unknown as Request, mockFinishResponse as unknown as Response)

			await imitateBrowser(finishWithError)
			await expect(loginPromise).rejects.toBe('unable to get authentication info')

			expect(expressGetMock).toHaveBeenCalledTimes(2)
			expect(expressGetMock).toHaveBeenCalledWith('/start', expect.any(Function))
			expect(expressGetMock).toHaveBeenCalledWith('/finish', expect.any(Function))

			expect(spinnerFailMock).toHaveBeenCalledTimes(1)
			expect(spinnerFailMock).toHaveBeenCalledWith()

			expect(expressListenMock).toHaveBeenCalledTimes(1)
			expect(expressListenMock).toHaveBeenCalledWith(7777, expect.any(Function))
			const listenHandler: () => Promise<void> = expressListenMock.mock.calls[0][1]
			await listenHandler()
			expect(open).toHaveBeenCalledTimes(1)
			expect(open).toHaveBeenCalledWith('http://localhost:7777/start')

			expect(mockStartResponse.redirect).toHaveBeenCalledTimes(1)

			expect(postMock).toHaveBeenCalledTimes(0)

			expect(mockFinishResponse.send).toHaveBeenCalledTimes(1)
			expect(mockFinishResponse.send).toHaveBeenCalledWith(expect.stringContaining('Failure trying to authenticate.'))

			expect(readFileMock).toHaveBeenCalledTimes(1)
			expect(writeFileMock).toHaveBeenCalledTimes(0)
			expect(chmodMock).toHaveBeenCalledTimes(0)
		})

		it('reports error when token request fails', async () => {
			readFileMock.mockReturnValueOnce(Buffer.from(JSON.stringify(credentialsFileData)))
			postMock.mockRejectedValueOnce({ name: 'forced error', message: 'forced failure' })
			const loginAuthenticator = setupAuthenticator()

			const loginPromise = loginAuthenticator.login()

			await imitateBrowser()
			await expect(loginPromise).rejects.toBe('unable to get authentication info')

			expect(expressGetMock).toHaveBeenCalledTimes(2)
			expect(expressGetMock).toHaveBeenCalledWith('/start', expect.any(Function))
			expect(expressGetMock).toHaveBeenCalledWith('/finish', expect.any(Function))

			expect(expressListenMock).toHaveBeenCalledTimes(1)
			expect(expressListenMock).toHaveBeenCalledWith(7777, expect.any(Function))
			const listenHandler: () => Promise<void> = expressListenMock.mock.calls[0][1]
			await listenHandler()
			expect(open).toHaveBeenCalledTimes(1)
			expect(open).toHaveBeenCalledWith('http://localhost:7777/start')

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

			expect(readFileMock).toHaveBeenCalledTimes(1)
			expect(writeFileMock).toHaveBeenCalledTimes(0)
			expect(chmodMock).toHaveBeenCalledTimes(0)
		})
	})

	describe('logout', () => {
		it('works on the happy path', async () => {
			readFileMock.mockReturnValue(Buffer.from(JSON.stringify(credentialsFileData)))
			const loginAuthenticator = setupAuthenticator()

			await expect(loginAuthenticator.logout()).resolves.toBe(undefined)

			expect(readFileMock).toHaveBeenCalledTimes(2)
			expect(writeFileMock).toHaveBeenCalledTimes(1)
			expect(writeFileMock).toHaveBeenCalledWith(credentialsFilename, '{}')
		})

		it('is fine when there is no profile to delete', async () => {
			readFileMock.mockReturnValue(Buffer.from(JSON.stringify(otherCredentialsFileData)))
			const loginAuthenticator = setupAuthenticator()

			await expect(loginAuthenticator.logout()).resolves.toBe(undefined)

			expect(readFileMock).toHaveBeenCalledTimes(2)
			expect(writeFileMock).toHaveBeenCalledTimes(1)
			expect(writeFileMock).toHaveBeenCalledWith(credentialsFilename, JSON.stringify(otherCredentialsFileData, null, 4))
		})
	})

	describe('authenticate', () => {
		it('calls generic authenticate', async () => {
			readFileMock.mockReturnValueOnce(Buffer.from(JSON.stringify(credentialsFileData)))

			const genericSpy = jest.spyOn(LoginAuthenticator.prototype, 'authenticateGeneric')

			const loginAuthenticator = setupAuthenticator()
			const requestConfig = {}

			const response = await loginAuthenticator.authenticate(requestConfig)

			expect(response.headers?.Authorization).toEqual('Bearer access token')
			expect(genericSpy).toBeCalledTimes(1)
		})
	})

	describe('authenticateGeneric', () => {
		it('refreshes token when necessary', async () => {
			readFileMock.mockReturnValueOnce(Buffer.from(JSON.stringify(refreshableCredentialsFileData)))

			const loginAuthenticator = setupAuthenticator()
			const requestConfig = {}

			const response = await loginAuthenticator.authenticate(requestConfig)

			expect(response.headers?.Authorization).toEqual('Bearer access token')

			expect(postMock).toHaveBeenCalledTimes(1)
			const postData = postMock.mock.calls[0][1]
			expect(postData).toMatch(/\bgrant_type=refresh_token\b/)
			expect(postData).toMatch(/\bclient_id=client-id\b/)
			expect(postData).toEqual(expect.stringContaining(`refresh_token=${refreshToken}`))
			const postConfig = postMock.mock.calls[0][2]
			expect(postConfig?.headers?.['Content-Type']).toBe('application/x-www-form-urlencoded')

			expect(readFileMock).toHaveBeenCalledTimes(2)
			expect(readFileMock).toHaveBeenCalledWith(credentialsFilename)
			expect(writeFileMock).toHaveBeenCalledTimes(1)
			expect(writeFileMock).toHaveBeenCalledWith(credentialsFilename, expect.stringMatching(/"myProfile":/))
		})

		it('includes User-Agent on refresh', async () => {
			readFileMock.mockReturnValueOnce(Buffer.from(JSON.stringify(refreshableCredentialsFileData)))
			const loginAuthenticator = setupAuthenticator()
			const requestConfig = {}

			await loginAuthenticator.authenticate(requestConfig)

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
			readFileMock.mockReturnValueOnce(Buffer.from(JSON.stringify(refreshableCredentialsFileData)))
			postMock.mockRejectedValueOnce(Error('forced failure'))
			postMock.mockResolvedValueOnce(tokenResponse)

			const loginAuthenticator = setupAuthenticator()
			const requestConfig = {}

			const promise = loginAuthenticator.authenticate(requestConfig)
			await imitateBrowser()
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

			expect(readFileMock).toHaveBeenCalledTimes(2)
			expect(readFileMock).toHaveBeenCalledWith(credentialsFilename)
			expect(writeFileMock).toHaveBeenCalledTimes(1)
			expect(writeFileMock).toHaveBeenCalledWith(credentialsFilename, expect.stringMatching(/"myProfile":/))
		})

		it('logs in not logged in', async () => {
			const loginAuthenticator = setupAuthenticator()
			const requestConfig = {}

			const promise = loginAuthenticator.authenticate(requestConfig)
			await imitateBrowser()
			const response = await promise

			expect(response.headers?.Authorization).toEqual('Bearer access token')

			expect(getPortMock).toHaveBeenCalledTimes(1)
			expect(getPortMock).toHaveBeenCalledWith({ ports: [61973, 61974, 61975] })

			expect(expressGetMock).toHaveBeenCalledTimes(2)
			expect(expressGetMock).toHaveBeenCalledWith('/start', expect.any(Function))
			expect(expressGetMock).toHaveBeenCalledWith('/finish', expect.any(Function))

			expect(expressListenMock).toHaveBeenCalledTimes(1)
			expect(expressListenMock).toHaveBeenCalledWith(7777, expect.any(Function))
			const listenHandler: () => Promise<void> = expressListenMock.mock.calls[0][1]
			await listenHandler()
			expect(open).toHaveBeenCalledTimes(1)
			expect(open).toHaveBeenCalledWith('http://localhost:7777/start')

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

			expect(readFileMock).toHaveBeenCalledTimes(2)
			expect(readFileMock).toHaveBeenCalledWith(credentialsFilename)
			expect(writeFileMock).toHaveBeenCalledTimes(1)
			expect(writeFileMock).toHaveBeenCalledWith(credentialsFilename, expect.stringMatching(/"myProfile":/))
		})
	})
})
