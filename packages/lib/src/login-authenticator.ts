import log4js from '@log4js-node/log4js-api'
import { CliUx } from '@oclif/core'
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { createHash, randomBytes, BinaryLike } from 'crypto'
import express from 'express'
import fs from 'fs'
import getPort from 'get-port'
import open from 'open'
import path from 'path'
import qs from 'qs'

import { SmartThingsURLProvider, defaultSmartThingsURLProvider, Authenticator, HttpClientHeaders } from '@smartthings/core-sdk'


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

function credentialsFile(): string {
	if (!('_credentialsFile' in (global as { _credentialsFile?: string }))) {
		throw new Error('LoginAuthenticator credentials file not set.')
	}
	return (global as unknown as { _credentialsFile: string })._credentialsFile
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

export class LoginAuthenticator implements Authenticator {
	public static init(credentialsFile: string): void {
		(global as { _credentialsFile?: string })._credentialsFile = credentialsFile

		const cliDir = path.dirname(credentialsFile)
		fs.mkdirSync(cliDir, { recursive: true })
	}
	private clientId: string
	private postConfig: AxiosRequestConfig

	private authenticationInfo?: AuthenticationInfo
	private logger = log4js.getLogger('login-authenticator')

	constructor(private profileName: string, private clientIdProvider: ClientIdProvider, userAgent: string) {
		this.logger.trace('constructing a LoginAuthenticator')
		this.clientId = clientIdProvider.clientId
		// we could consider doing this lazily at some point
		const credentialsFileData = this.readCredentialsFile()
		if (profileName in credentialsFileData) {
			const authInfo = credentialsFileData[profileName]
			this.authenticationInfo = {
				...authInfo,
				expires: new Date(authInfo.expires),
			}
			this.logger.trace(`authentication info from file = ${scrubAuthInfo(this.authenticationInfo)}`)
		}

		this.postConfig = {
			headers: {
				/* eslint-disable @typescript-eslint/naming-convention */
				'Content-Type': 'application/x-www-form-urlencoded',
				'User-Agent': userAgent,
				/* eslint-enable @typescript-eslint/naming-convention */
			},
		}
	}

	private sha256(data: BinaryLike): Buffer {
		return createHash('sha256').update(data).digest()
	}

	private readCredentialsFile(): CredentialsFileData {
		let fileData = '{}'
		try {
			fileData = fs.readFileSync(credentialsFile()).toString()
		} catch (err) {
			if (err.code !== 'ENOENT') { throw err }
		}

		return JSON.parse(fileData)
	}

	private writeCredentialsFile(credentialsFileData: CredentialsFileData): void {
		fs.writeFileSync(credentialsFile(), JSON.stringify(credentialsFileData, null, 4))
		fs.chmod(credentialsFile(), 0o600, error => {
			if (error) {
				this.logger.error('failed to set permissions on credentials file', error)
			}
		})
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private updateTokenFromResponse(response: AxiosResponse<any>): void {
		const authenticationInfo = {
			accessToken: response.data.access_token,
			refreshToken: response.data.refresh_token,
			expires: new Date(Date.now() + response.data.expires_in * 1000),
			scope: response.data.scope,
			installedAppId: response.data.installed_app_id,
			deviceId: response.data.device_id,
		}
		const credentialsFileData = this.readCredentialsFile()
		credentialsFileData[this.profileName] = authenticationInfo
		this.writeCredentialsFile(credentialsFileData)
		this.authenticationInfo = authenticationInfo
	}

	async login(): Promise<void> {
		const app = express()
		const port = await getPort({ port: [61973, 61974, 61975] })
		const finishURL = `http://localhost:${port}/finish`
		const baseOAuthInURL = this.clientIdProvider.baseOAuthInURL

		const verifier = randomBytes(32).toString('base64url')
		const codeChallenge = this.sha256(verifier).toString('base64url')

		let loginFailed = false

		app.get('/start', (_req, res) => {
			const authorizeURL = new URL(`${baseOAuthInURL}/authorize`)
			authorizeURL.search = new URLSearchParams({
				/* eslint-disable @typescript-eslint/naming-convention */
				scope: scopes.join('+'),
				response_type: 'code',
				client_id: this.clientId,
				code_challenge: codeChallenge,
				code_challenge_method: 'S256',
				redirect_uri: finishURL,
				client_type: 'USER_LEVEL',
				/* eslint-enable @typescript-eslint/naming-convention */
			}).toString()

			this.logger.debug('redirecting to', `${authorizeURL.origin}${authorizeURL.pathname}`)
			res.redirect(authorizeURL.toString())
		})

		app.get('/finish', (req, res) => {
			if ('error' in req.query) {
				this.logger.error('error trying to authenticate', req.query.error)
				if ('error_description' in req.query) {
					this.logger.error(`${req.query.error_description}`)
				}

				loginFailed = true
				res.send('<html><body><h1>Failure trying to authenticate.</h1></body></html>')
				return
			}

			const requestBody = {
				/* eslint-disable @typescript-eslint/naming-convention */
				'grant_type': 'authorization_code',
				'client_id': this.clientId,
				'code_verifier': verifier,
				'code': req.query.code,
				'redirect_uri': finishURL,
				/* eslint-enable @typescript-eslint/naming-convention */
			}

			this.logger.debug(`making axios request: ${baseOAuthInURL}/token`)
			axios.post(`${baseOAuthInURL}/token`, qs.stringify(requestBody), this.postConfig)
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				.then((response: AxiosResponse<any>) => {
					this.updateTokenFromResponse(response)
					res.send('<html><body><h1>You can close the window.</h1></body></html>')
				})
				.catch((error: AxiosError) => {
					this.logger.error('error obtaining token:', error.message)
					if (error.isAxiosError) {
						const axiosError = error as AxiosError
						if (axiosError.response) {
							this.logger.error(axiosError.response.data)
						}
					}

					loginFailed = true
					res.send('<html><body><h1>Failure obtaining access token.</h1></body></html>')
				})
		})

		const server = app.listen(port, async () => {
			this.logger.debug(`login start: listening on port ${port}`)
			CliUx.ux.action.start('logging in')
			await open(`http://localhost:${port}/start`)
		})

		const startTime = Date.now()
		const maxDelay = 10 * 60 * 1000 // wait up to ten minutes for login
		this.authenticationInfo = undefined
		// eslint-disable-next-line no-async-promise-executor
		return new Promise(async (resolve, reject) => {
			while (!loginFailed && !this.authenticationInfo && Date.now() < startTime + maxDelay) {
				await CliUx.ux.wait(1000)
			}

			server.close(error => {
				if (error) {
					this.logger.error('error closing express server', error)
				}

				if (this.authenticationInfo) {
					this.logger.trace('got authentication info', scrubAuthInfo(this.authenticationInfo))
					this.logger.debug('login success')
					CliUx.ux.action.stop()

					resolve()
				} else {
					this.logger.error('unable to get authentication info')
					CliUx.ux.action.stop('failed')

					reject('unable to get authentication info')
				}
			})
		})
	}

	async logout(): Promise<void> {
		const credentialsFileData = this.readCredentialsFile()
		delete credentialsFileData[this.profileName]
		this.writeCredentialsFile(credentialsFileData)
	}

	private async refreshToken(): Promise<void> {
		this.logger.debug('refreshing token')
		const oauthAuthTokenRefreshURL = this.clientIdProvider.oauthAuthTokenRefreshURL
		const requestBody = {
			/* eslint-disable @typescript-eslint/naming-convention */
			'grant_type': 'refresh_token',
			'client_id': this.clientId,
			'refresh_token': this.authenticationInfo?.refreshToken,
			/* eslint-enable @typescript-eslint/naming-convention */
		}

		this.logger.debug(`making axios request: ${oauthAuthTokenRefreshURL}`)
		await axios.post(oauthAuthTokenRefreshURL, qs.stringify(requestBody), this.postConfig)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.then((response: AxiosResponse<any>) => {
				this.updateTokenFromResponse(response)
			})
			.catch((error: AxiosError) => {
				this.logger.error('error trying to refresh token:', error.message)
				if (error.isAxiosError) {
					const axiosError = error as AxiosError
					if (axiosError.response) {
						this.logger.error(axiosError.response.data)
					}
				}
			})
	}

	async authenticate(): Promise<HttpClientHeaders> {
		this.logger.debug('authentication - enter')
		// refresh if we have less than an hour left on the auth token
		if (this.authenticationInfo && this.authenticationInfo.expires.getTime() < Date.now() + 60 * 60 * 1000) {
			await this.refreshToken()
		}

		// log in if we don't have authentication info or the refresh failed
		if (!this.authenticationInfo || this.authenticationInfo.expires.getTime() < Date.now() + 59 * 60 * 1000) {
			await this.login()
		}

		if (this.authenticationInfo) {
			return { Authorization: `Bearer ${this.authenticationInfo.accessToken}` }
		}

		throw new Error('unable to obtain user credentials')
	}
}
