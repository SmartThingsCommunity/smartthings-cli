import { chmod, readFileSync, mkdirSync, writeFileSync } from 'fs'
import path from 'path'

import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { createHash, randomBytes, BinaryLike } from 'crypto'
import express from 'express'
import { getPort } from 'get-port-please'
import log4js from 'log4js'
import open from 'open'
import ora from 'ora'
import qs from 'qs'

import { SmartThingsURLProvider, defaultSmartThingsURLProvider, Authenticator } from '@smartthings/core-sdk'

import { delay } from './util.js'


export type ClientIdProvider = SmartThingsURLProvider & {
	clientId: string
	baseOAuthInURL: string
	oauthAuthTokenRefreshURL: string
}

export const defaultClientIdProvider: ClientIdProvider = {
	...defaultSmartThingsURLProvider,
	baseOAuthInURL: 'https://oauthin-regional.api.smartthings.com/oauth',
	oauthAuthTokenRefreshURL: 'https://auth-global.api.smartthings.com/oauth/token',
	clientId: 'd18cf96e-c626-4433-bf51-ddbb10c5d1ed',
}

// All the scopes the clientId we are using is configured to use.
const scopes = ['controller:stCli']

type AuthenticationInfo = {
	accessToken: string
	refreshToken: string
	expires: Date
	// scope is a space-separated list of scopes
	// In the future, we could consider making the type `string | string[]`
	scope: string
	installedAppId: string
	deviceId: string
}

type CredentialsFileData = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[profileName: string]: any
}

/**
 * Convert to string and scrub sensitive values
 * Meant to be used before logging
 */
function scrubAuthInfo(authInfo?: AuthenticationInfo): string {
	const message = JSON.stringify(authInfo)
	const tokenRegex = /"([\w]*token":"[0-9a-f]{8}).+?"/ig
	return message.replace(tokenRegex, '"$1-xxxx-xxxx-xxxx-xxxxxxxxxxxx"')
}

export const loginAuthenticator = (credentialsFile: string, profileName: string, clientIdProvider: ClientIdProvider, userAgent: string): Authenticator => {
	let authenticationInfo: AuthenticationInfo | undefined

	const logger = log4js.getLogger('login-authenticator')
	logger.trace('constructing a LoginAuthenticator')

	const cliDir = path.dirname(credentialsFile)
	mkdirSync(cliDir, { recursive: true })

	const readCredentialsFile = (): CredentialsFileData => {
		try {
			return JSON.parse(readFileSync(credentialsFile).toString())
		} catch (err) {
			if (err.code !== 'ENOENT') { throw err }
		}

		return {}
	}

	const clientId = clientIdProvider.clientId
	const credentialsFileData = readCredentialsFile()
	if (profileName in credentialsFileData) {
		const authInfo = credentialsFileData[profileName]
		authenticationInfo = {
			...authInfo,
			expires: new Date(authInfo.expires),
		}
		logger.trace(`authentication info from file = ${scrubAuthInfo(authenticationInfo)}`)
	}

	const postConfig: AxiosRequestConfig = {
		headers: {
			/* eslint-disable @typescript-eslint/naming-convention */
			'Content-Type': 'application/x-www-form-urlencoded',
			'User-Agent': userAgent,
			/* eslint-enable @typescript-eslint/naming-convention */
		},
	}

	const sha256 = (data: BinaryLike): Buffer => createHash('sha256').update(data).digest()

	const writeCredentialsFile = (credentialsFileData: CredentialsFileData): void => {
		writeFileSync(credentialsFile, JSON.stringify(credentialsFileData, null, 4))
		chmod(credentialsFile, 0o600, error => {
			if (error) {
				logger.error('failed to set permissions on credentials file', error)
			}
		})
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const updateTokenFromResponse = (response: AxiosResponse<any>): void => {
		const updatedAuthenticationInfo = {
			accessToken: response.data.access_token,
			refreshToken: response.data.refresh_token,
			expires: new Date(Date.now() + response.data.expires_in * 1000),
			scope: response.data.scope,
			installedAppId: response.data.installed_app_id,
			deviceId: response.data.device_id,
		}
		const credentialsFileData = readCredentialsFile()
		credentialsFileData[profileName] = updatedAuthenticationInfo
		writeCredentialsFile(credentialsFileData)
		authenticationInfo = updatedAuthenticationInfo
	}

	const login = async (): Promise<void> => {
		const app = express()
		const port = await getPort({ ports: [61973, 61974, 61975] })
		const finishURL = `http://localhost:${port}/finish`
		const baseOAuthInURL = clientIdProvider.baseOAuthInURL

		const verifier = randomBytes(32).toString('base64url')
		const codeChallenge = sha256(verifier).toString('base64url')

		let loginFailed = false

		app.get('/start', (_req, res) => {
			const authorizeURL = new URL(`${baseOAuthInURL}/authorize`)
			authorizeURL.search = new URLSearchParams({
				/* eslint-disable @typescript-eslint/naming-convention */
				scope: scopes.join('+'),
				response_type: 'code',
				client_id: clientId,
				code_challenge: codeChallenge,
				code_challenge_method: 'S256',
				redirect_uri: finishURL,
				client_type: 'USER_LEVEL',
				/* eslint-enable @typescript-eslint/naming-convention */
			}).toString()

			logger.debug('redirecting to', `${authorizeURL.origin}${authorizeURL.pathname}`)
			res.redirect(authorizeURL.toString())
		})

		app.get('/finish', (req, res) => {
			if ('error' in req.query) {
				logger.error('error trying to authenticate', req.query.error)
				if ('error_description' in req.query) {
					logger.error(`${req.query.error_description}`)
				}

				loginFailed = true
				res.send('<html><body><h1>Failure trying to authenticate.</h1></body></html>')
				return
			}

			const requestBody = {
				/* eslint-disable @typescript-eslint/naming-convention */
				'grant_type': 'authorization_code',
				'client_id': clientId,
				'code_verifier': verifier,
				'code': req.query.code,
				'redirect_uri': finishURL,
				/* eslint-enable @typescript-eslint/naming-convention */
			}

			logger.debug(`making axios request: ${baseOAuthInURL}/token`)
			axios.post(`${baseOAuthInURL}/token`, qs.stringify(requestBody), postConfig)
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				.then((response: AxiosResponse<any>) => {
					updateTokenFromResponse(response)
					res.send('<html><body><h1>You can close the window.</h1></body></html>')
				})
				.catch(error => {
					logger.error('error obtaining token:', error.message)
					if (error.isAxiosError) {
						const axiosError = error as AxiosError
						if (axiosError.response) {
							logger.error(axiosError.response.data)
						}
					}

					loginFailed = true
					res.send('<html><body><h1>Failure obtaining access token.</h1></body></html>')
				})
		})

		const spinner = ora('Logging In')
		const server = app.listen(port, async () => {
			logger.debug(`login start: listening on port ${port}`)
			spinner.start()
			await open(`http://localhost:${port}/start`)
		})

		const startTime = Date.now()
		const maxDelay = 10 * 60 * 1000 // wait up to ten minutes for login
		authenticationInfo = undefined
		// eslint-disable-next-line no-async-promise-executor
		return new Promise(async (resolve, reject) => {
			while (!loginFailed && !authenticationInfo && Date.now() < startTime + maxDelay) {
				await delay(1000)
			}

			server.close(error => {
				if (error) {
					logger.error('error closing express server', error)
				}

				if (authenticationInfo) {
					logger.trace('got authentication info', scrubAuthInfo(authenticationInfo))
					logger.debug('login success')
					spinner.succeed()

					resolve()
				} else {
					const failMsg = 'unable to get authentication info'
					logger.error(failMsg)
					spinner.fail()
					reject(failMsg)
				}
			})
		})
	}

	const logout = async (): Promise<void> => {
		const credentialsFileData = readCredentialsFile()
		delete credentialsFileData[profileName]
		writeCredentialsFile(credentialsFileData)
	}

	const refreshToken = async (): Promise<void> => {
		logger.debug('refreshing token')
		const oauthAuthTokenRefreshURL = clientIdProvider.oauthAuthTokenRefreshURL
		const requestBody = {
			/* eslint-disable @typescript-eslint/naming-convention */
			'grant_type': 'refresh_token',
			'client_id': clientId,
			'refresh_token': authenticationInfo?.refreshToken,
			/* eslint-enable @typescript-eslint/naming-convention */
		}

		logger.debug(`making axios request: ${oauthAuthTokenRefreshURL}`)
		await axios.post(oauthAuthTokenRefreshURL, qs.stringify(requestBody), postConfig)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.then((response: AxiosResponse<any>) => {
				updateTokenFromResponse(response)
			})
			.catch((error) => {
				logger.error('error trying to refresh token:', error.message)
				if (error.isAxiosError) {
					const axiosError = error as AxiosError
					if (axiosError.response) {
						logger.error(axiosError.response.data)
					}
				}
			})
	}

	const authenticateGeneric = async (): Promise<string> => {
		logger.debug('authentication - enter')
		// refresh if we have less than an hour left on the auth token
		if (authenticationInfo && authenticationInfo.expires.getTime() < Date.now() + 60 * 60 * 1000) {
			await refreshToken()
		}

		// log in if we don't have authentication info or the refresh failed
		if (!authenticationInfo || authenticationInfo.expires.getTime() < Date.now() + 59 * 60 * 1000) {
			await login()
		}

		if (authenticationInfo) {
			return authenticationInfo.accessToken
		}

		throw new Error('unable to obtain user credentials')
	}

	const authenticate = async (requestConfig: AxiosRequestConfig): Promise<AxiosRequestConfig> => {
		const token = await authenticateGeneric()

		return {
			...requestConfig,
			headers: {
				...requestConfig.headers,
				Authorization: `Bearer ${token}`,
			},
		}
	}

	return {
		login,
		logout,
		authenticateGeneric,
		authenticate,
	}
}
