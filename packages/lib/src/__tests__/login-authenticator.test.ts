import fs, { NoParamCallback, PathLike } from 'fs'

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import getPort from 'get-port'
import open from 'open'

import { logManager } from '../logger'
import { LoginAuthenticator } from '../login-authenticator'

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

const mockApp = {
	get: jest.fn(),
	listen: jest.fn(),
}
jest.mock('express', () => {
	return () => mockApp
})

jest.mock('get-port')
jest.mock('open')
jest.mock('axios')

async function delay(milliseconds: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, milliseconds))
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
	const config = {
		appenders: {
			main: { type: 'recording' },
			stdout: { type: 'stdout' },
		},
		categories: {
			default: { appenders: ['main'], level: 'ERROR' },
			'login-authenticator': { appenders: ['main'], level: 'TRACE' },
		},
	}
	const credentialsFileData = {
		[profileName]: {
			'accessToken': 'an access token',
			'refreshToken': 'a refresh token',
			'expires': '2020-10-15T13:26:39.966Z',
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
	interface AuthTokenResponse {
		access_token: string
		refresh_token: string
		expires_in: number
		scope: string
		installed_app_id: string
		device_id: string
	}
	const tokenResponse: AxiosResponse<AuthTokenResponse> = {
		data: {
			access_token: 'access token',
			refresh_token: 'refresh token',
			expires_in: 24 * 3600,
			scope: 'scope list',
			installed_app_id: 'installed app id',
			device_id: 'device id',
		},
		status: 200,
		statusText: 'OK',
		headers: '',
		config: {},
	}

	const mockServer = {
		close: jest.fn(),
	}

	mockApp.listen.mockReturnValue(mockServer)

	const mockStartResponse = {
		redirect: jest.fn(),
	}
	const mockFinishRequest = {
		query: { code: 'auth-code' },
	}
	const mockFinishResponse = {
		send: jest.fn(),
	}


	logManager.init(config)

	const mkdirMock = fs.mkdirSync as jest.Mock<typeof fs.mkdirSync>
	const readFileMock = (fs.readFileSync as unknown as jest.Mock<Buffer, [fs.PathLike]>)
		.mockImplementation(() => { throw { code: 'ENOENT' } })
	const writeFileMock = fs.writeFileSync as jest.Mock<typeof fs.writeFileSync>
	const chmodMock = fs.chmod as unknown as jest.Mock<void, [PathLike, string | number, NoParamCallback]>

	const getPortMock = (getPort as unknown as jest.Mock<Promise<number>, [getPort.Options | undefined]>)
		.mockResolvedValue(7777)
	const postMock = (axios.post as unknown as jest.Mock<Promise<AxiosResponse<unknown>>, [string, unknown, AxiosRequestConfig | undefined]>)
		.mockResolvedValue(tokenResponse)

	function setupAuthenticator(): LoginAuthenticator {
		LoginAuthenticator.init(credentialsFilename)
		return new LoginAuthenticator(profileName, clientIdProvider)
	}

	type ExpressRouteHandler = (request: Request, response: Response) => void
	const finishHappy = (finishHandler: ExpressRouteHandler): void =>
		finishHandler(mockFinishRequest as unknown as Request, mockFinishResponse as unknown as Response)
	// Call handlers like would happen if the user were following the flow in the browser.
	async function imitateBrowser(finishHandlerCaller = finishHappy): Promise<void> {
		while (mockApp.get.mock.calls.length < 2) {
			await delay(25)
		}
		const startHandler: ExpressRouteHandler = mockApp.get.mock.calls[0][1]
		const finishHandler: ExpressRouteHandler = mockApp.get.mock.calls[1][1]

		startHandler({} as Request, mockStartResponse as unknown as Response)
		finishHandlerCaller(finishHandler)

		while (mockServer.close.mock.calls.length < 1) {
			await delay(25)
		}
		const closeHandler: (error?: Error) => void = mockServer.close.mock.calls[0][0]
		closeHandler()
	}

	afterEach(() => {
		jest.clearAllMocks()
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
			expect(() => new LoginAuthenticator(profileName, clientIdProvider))
				.toThrow('LoginAuthenticator credentials file not set.')
		})

		it('constructs without errors', function () {
			LoginAuthenticator.init(credentialsFilename)

			const loginAuthenticator = new LoginAuthenticator(profileName, clientIdProvider)

			expect(loginAuthenticator).toBeDefined()
		})

		it('reads auth from credentials file', () => {
			readFileMock.mockReturnValueOnce(Buffer.from(JSON.stringify(credentialsFileData)))
			LoginAuthenticator.init(credentialsFilename)

			const loginAuthenticator = new LoginAuthenticator(profileName, clientIdProvider)

			expect(loginAuthenticator).toBeDefined()

			const logs = recording.replay()
			expect(logs.length).toBe(2)
			expect(logs[0].data[0]).toBe('constructing a LoginAuthenticator')
			expect(logs[1].data[0]).toEqual(`authentication info from file = ${JSON.stringify(credentialsFileData[profileName], null, 4)}`)
		})
	})

	describe('login', () => {
		it('works on the happy path', async () => {
			const loginAuthenticator = setupAuthenticator()

			const loginPromise = loginAuthenticator.login()

			await imitateBrowser()
			await loginPromise

			expect(getPortMock).toHaveBeenCalledTimes(1)
			expect(getPortMock).toHaveBeenCalledWith({ port: [61973, 61974, 61975] })

			expect(mockApp.get).toHaveBeenCalledTimes(2)
			expect(mockApp.get).toHaveBeenCalledWith('/start', expect.any(Function))
			expect(mockApp.get).toHaveBeenCalledWith('/finish', expect.any(Function))

			expect(mockApp.listen).toHaveBeenCalledTimes(1)
			expect(mockApp.listen).toHaveBeenCalledWith(7777, expect.any(Function))
			const listenHandler: () => Promise<void> = mockApp.listen.mock.calls[0][1]
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
			expect(postConfig?.headers['Content-Type']).toBe('application/x-www-form-urlencoded')

			expect(mockFinishResponse.send).toHaveBeenCalledTimes(1)
			expect(mockFinishResponse.send).toHaveBeenCalledWith(expect.stringContaining('You can close the window.'))

			expect(readFileMock).toHaveBeenCalledTimes(2)
			expect(readFileMock).toHaveBeenCalledWith(credentialsFilename)
			expect(writeFileMock).toHaveBeenCalledTimes(1)
			expect(writeFileMock).toHaveBeenCalledWith(credentialsFilename, expect.stringMatching(/"myProfile":/))
			expect(chmodMock).toHaveBeenCalledTimes(1)
			expect(chmodMock).toHaveBeenCalledWith(credentialsFilename, 0o600, expect.any(Function))
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
					error_description: 'because of reasons',
				},
			}
			const finishWithError = (finishHandler: ExpressRouteHandler): void =>
				finishHandler(mockFinishRequest as unknown as Request, mockFinishResponse as unknown as Response)

			await imitateBrowser(finishWithError)
			await loginPromise

			expect(mockApp.get).toHaveBeenCalledTimes(2)
			expect(mockApp.get).toHaveBeenCalledWith('/start', expect.any(Function))
			expect(mockApp.get).toHaveBeenCalledWith('/finish', expect.any(Function))

			expect(mockApp.listen).toHaveBeenCalledTimes(1)
			expect(mockApp.listen).toHaveBeenCalledWith(7777, expect.any(Function))
			const listenHandler: () => Promise<void> = mockApp.listen.mock.calls[0][1]
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
			await loginPromise

			expect(mockApp.get).toHaveBeenCalledTimes(2)
			expect(mockApp.get).toHaveBeenCalledWith('/start', expect.any(Function))
			expect(mockApp.get).toHaveBeenCalledWith('/finish', expect.any(Function))

			expect(mockApp.listen).toHaveBeenCalledTimes(1)
			expect(mockApp.listen).toHaveBeenCalledWith(7777, expect.any(Function))
			const listenHandler: () => Promise<void> = mockApp.listen.mock.calls[0][1]
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
			expect(postConfig?.headers['Content-Type']).toBe('application/x-www-form-urlencoded')

			expect(mockFinishResponse.send).toHaveBeenCalledTimes(1)
			expect(mockFinishResponse.send).toHaveBeenCalledWith(expect.stringContaining('Failure trying retrieve token.'))

			expect(readFileMock).toHaveBeenCalledTimes(1)
			expect(writeFileMock).toHaveBeenCalledTimes(0)
			expect(chmodMock).toHaveBeenCalledTimes(0)
		})
	})

	describe('authenticate', () => {
		it('calls generic authenticate', async () => {
			readFileMock.mockReturnValueOnce(Buffer.from(JSON.stringify(credentialsFileData)))

			const genericSpy = jest.spyOn(LoginAuthenticator.prototype, 'authenticateGeneric')

			const loginAuthenticator = setupAuthenticator()
			const requestConfig = {}

			const response = await loginAuthenticator.authenticate(requestConfig)

			expect(response.headers.Authorization).toEqual('Bearer access token')
			expect(genericSpy).toBeCalledTimes(1)
		})
	})

	describe('authenticateGeneric', () => {
		it('refreshes token when necessary', async () => {
			readFileMock.mockReturnValueOnce(Buffer.from(JSON.stringify(refreshableCredentialsFileData)))

			const loginAuthenticator = setupAuthenticator()
			const requestConfig = {}

			const response = await loginAuthenticator.authenticate(requestConfig)

			expect(response.headers.Authorization).toEqual('Bearer access token')

			expect(postMock).toHaveBeenCalledTimes(1)
			const postData = postMock.mock.calls[0][1]
			expect(postData).toMatch(/\bgrant_type=refresh_token\b/)
			expect(postData).toMatch(/\bclient_id=client-id\b/)
			expect(postData).toMatch(/\brefresh_token=a%20refresh%20token\b/)
			const postConfig = postMock.mock.calls[0][2]
			expect(postConfig?.headers['Content-Type']).toBe('application/x-www-form-urlencoded')

			expect(readFileMock).toHaveBeenCalledTimes(2)
			expect(readFileMock).toHaveBeenCalledWith(credentialsFilename)
			expect(writeFileMock).toHaveBeenCalledTimes(1)
			expect(writeFileMock).toHaveBeenCalledWith(credentialsFilename, expect.stringMatching(/"myProfile":/))
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

			expect(response.headers.Authorization).toEqual('Bearer access token')

			expect(postMock).toHaveBeenCalledTimes(2)
			const postData = postMock.mock.calls[0][1]
			expect(postData).toMatch(/\bgrant_type=refresh_token\b/)
			expect(postData).toMatch(/\bclient_id=client-id\b/)
			expect(postData).toMatch(/\brefresh_token=a%20refresh%20token\b/)
			const postConfig = postMock.mock.calls[0][2]
			expect(postConfig?.headers['Content-Type']).toBe('application/x-www-form-urlencoded')
			expect(postMock).toHaveBeenCalledWith('https://example.com/oauth-in-url/token', expect.anything(), expect.anything())
			const postData2 = postMock.mock.calls[1][1]
			expect(postData2).toMatch(/\bgrant_type=authorization_code\b/)
			expect(postData2).toMatch(/\bclient_id=client-id\b/)
			expect(postData2).toMatch(codeVerifierRegex)
			expect(postData2).toMatch(/\bcode=auth-code\b/)
			expect(postData2).toMatch(/\bredirect_uri=http%3A%2F%2Flocalhost%3A7777%2Ffinish\b/)
			const postConfig2 = postMock.mock.calls[1][2]
			expect(postConfig2?.headers['Content-Type']).toBe('application/x-www-form-urlencoded')

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

			expect(response.headers.Authorization).toEqual('Bearer access token')

			expect(getPortMock).toHaveBeenCalledTimes(1)
			expect(getPortMock).toHaveBeenCalledWith({ port: [61973, 61974, 61975] })

			expect(mockApp.get).toHaveBeenCalledTimes(2)
			expect(mockApp.get).toHaveBeenCalledWith('/start', expect.any(Function))
			expect(mockApp.get).toHaveBeenCalledWith('/finish', expect.any(Function))

			expect(mockApp.listen).toHaveBeenCalledTimes(1)
			expect(mockApp.listen).toHaveBeenCalledWith(7777, expect.any(Function))
			const listenHandler: () => Promise<void> = mockApp.listen.mock.calls[0][1]
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
			expect(postConfig?.headers['Content-Type']).toBe('application/x-www-form-urlencoded')

			expect(mockFinishResponse.send).toHaveBeenCalledTimes(1)
			expect(mockFinishResponse.send).toHaveBeenCalledWith(expect.stringContaining('You can close the window.'))

			expect(readFileMock).toHaveBeenCalledTimes(2)
			expect(readFileMock).toHaveBeenCalledWith(credentialsFilename)
			expect(writeFileMock).toHaveBeenCalledTimes(1)
			expect(writeFileMock).toHaveBeenCalledWith(credentialsFilename, expect.stringMatching(/"myProfile":/))
		})
	})
})
