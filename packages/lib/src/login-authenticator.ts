import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { createHash, randomBytes, BinaryLike } from 'crypto'
import express from 'express'
import fs from 'fs'
import getPort from 'get-port'
import open from 'open'
import path from 'path'
import qs from 'qs'

import { Authenticator } from '@smartthings/core-sdk'
import { SmartThingsURLProvider, defaultSmartThingsURLProvider } from '@smartthings/core-sdk'

import { logManager } from './logger'


export interface ClientIdProvider extends SmartThingsURLProvider {
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
const scopes = ['controller%3AstCli']
const postConfig = {
	headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
	},
}


interface AuthenticationInfo {
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

export class LoginAuthenticator implements Authenticator {
	private static credentialsFile?: string
	public static init(credentialsFile: string): void {
		(global as { _credentialsFile?: string })._credentialsFile = credentialsFile

		const cliDir = path.dirname(credentialsFile)
		fs.mkdirSync(cliDir, { recursive: true })
	}
	private clientId: string

	private authenticationInfo?: AuthenticationInfo
	private logger = logManager.getLogger('login-authenticator')

	constructor(private profileName: string, private clientIdProvider: ClientIdProvider) {
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
			this.logger.trace(`authentication info from file = ${JSON.stringify(this.authenticationInfo, null, 4)}`)
		}
	}

	private base64URLEncode(data: Buffer): string {
		return data.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
	}

	private sha256(data: BinaryLike): Buffer {
		return createHash('sha256').update(data).digest()

	}

	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms))
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private readCredentialsFile(): { [profileName: string]: any } {
		let fileData = '{}'
		try {
			fileData = fs.readFileSync(credentialsFile()).toString()
		} catch (err) {
			if (err.code !== 'ENOENT') { throw err }
		}

		return JSON.parse(fileData)
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
		fs.writeFileSync(credentialsFile(), JSON.stringify(credentialsFileData, null, 4))
		fs.chmod(credentialsFile(), 0o600, err => {
			if (err) {
				this.logger.error('failed to set permissions on credentials file', err)
			}
		})
		this.authenticationInfo = authenticationInfo
	}

	async login(): Promise<void> {
		const verifier = this.base64URLEncode(randomBytes(32))

		const app = express()

		const port = await getPort({ port: [61973, 61974, 61975] })

		const baseOAuthInURL = this.clientIdProvider.baseOAuthInURL
		const codeChallenge = this.base64URLEncode(this.sha256(verifier))
		const finishURL = `http://localhost:${port}/finish`
		app.get('/start', (req, res) => {
			const redirectTo = `${baseOAuthInURL}/authorize?scope=${scopes.join('+')}&` +
				`response_type=code&client_id=${this.clientId}&` +
				`code_challenge=${codeChallenge}&code_challenge_method=S256&` +
				`redirect_uri=${encodeURIComponent(finishURL)}&` +
				'client_type=USER_LEVEL'
			this.logger.trace(`redirecting to: ${redirectTo}`)
			res.redirect(redirectTo)
		})

		app.get('/finish', (req, res) => {
			if ('error' in req.query) {
				this.logger.error(`received "${req.query.error}" error when trying to authenticate`)
				if ('error_description' in req.query) {
					this.logger.error(`  ${req.query.error_description}`)
				}
				res.send('<html><body><h1>Failure trying to authenticate.</h1></body></html>')
				return
			}
			const requestBody = {
				'grant_type': 'authorization_code',
				'client_id': this.clientId,
				'code_verifier': verifier,
				'code': req.query.code,
				'redirect_uri': finishURL,
			}
			this.logger.trace(`making axios request to ${baseOAuthInURL}/token with:`)
			this.logger.trace(`  body: ${qs.stringify(requestBody)}`)
			this.logger.trace(`  config: ${JSON.stringify(postConfig)}`)
			this.logger.trace(`code = ${req.query.code}`)
			// I used this for debugging. Axios does not include the body of the response in any way I could find.
			// this.logger.trace(`\n\nRun:\ncurl -i --request POST --url '${baseOAuthInURL}/token' --header 'content-type: application/x-www-form-urlencoded' ` +
			// 	`--data grant_type=authorization_code --data 'client_id=${this.clientId}' --data code_verifier=${verifier} --data code=${req.query.code} ` +
			// 	`--data 'redirect_uri=${finishURL}' --header 'X-ST-CORRELATION: ross-pkce-attempt'\n\n`)
			axios.post(`${baseOAuthInURL}/token`, qs.stringify(requestBody), postConfig)
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				.then((response: AxiosResponse<any>) => {
					this.updateTokenFromResponse(response)
					res.send('<html><body><h1>You can close the window.</h1></body></html>')
				})
				.catch(err => {
					this.logger.trace(`got error ${err.name}/${err}}/${err.message} trying to get final token`)
					this.logger.trace(`err = ${JSON.stringify(err, null, 4)}`)
					res.send('<html><body><h1>Failure trying retrieve token.</h1></body></html>')
				})
		})

		const server = app.listen(port, async () => {
			this.logger.trace(`listening on port ${port}`)
			await open(`http://localhost:${port}/start`)
		})

		const startTime = Date.now()
		const maxDelay = 10 * 60 * 1000 // wait up to ten minutes for login
		// eslint-disable-next-line no-async-promise-executor
		return new Promise(async (resolve, reject) => {
			while (!this.authenticationInfo && Date.now() < startTime + maxDelay) {
				process.stderr.write('.')
				await this.delay(1000)
			}
			server.close((err) => {
				if (err) {
					this.logger.error(`error closing express server: ${err}`)
				}
				if (this.authenticationInfo) {
					this.logger.trace(`got authentication info: ${JSON.stringify(this.authenticationInfo)}`)
					resolve()
				} else {
					this.logger.trace('unable to get authentication info')
					reject()
				}
			})
		})
	}

	private async refreshToken(): Promise<void> {
		this.logger.trace('refreshing token')
		const oauthAuthTokenRefreshURL = this.clientIdProvider.oauthAuthTokenRefreshURL
		const requestBody = {
			'grant_type': 'refresh_token',
			'client_id': this.clientId,
			'refresh_token': this.authenticationInfo?.refreshToken,
		}
		const postConfig = {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		}
		this.logger.trace(`making axios request to ${oauthAuthTokenRefreshURL} with:`)
		this.logger.trace(`  body: ${qs.stringify(requestBody)}`)
		this.logger.trace(`  config: ${JSON.stringify(postConfig)}`)
		await axios.post(oauthAuthTokenRefreshURL, qs.stringify(requestBody), postConfig)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.then((response: AxiosResponse<any>) => {
				this.updateTokenFromResponse(response)
			})
			.catch(err => {
				this.logger.trace(`got error ${err.name}/${err}}/${err.message} trying to get refresh token`)
				this.logger.trace(`err = ${JSON.stringify(err, null, 4)}`)
			})
	}

	async authenticate(requestConfig: AxiosRequestConfig): Promise<AxiosRequestConfig> {
		this.logger.trace('authentication - enter')
		// refresh if we have less than an hour left on the auth token
		if (this.authenticationInfo && this.authenticationInfo.expires.getTime() < Date.now() + 60 * 60 * 1000) {
			await this.refreshToken()
		}
		// log in if we don't have authentication info or the refresh failed
		if (!this.authenticationInfo || this.authenticationInfo.expires.getTime() < Date.now() + 59 * 60 * 1000) {
			await this.login()
		}
		if (this.authenticationInfo) {
			return {
				...requestConfig,
				headers: {
					...requestConfig.headers,
					Authorization: `Bearer ${this.authenticationInfo.accessToken}`,
				},
			}
		}
		throw new Error('unable to obtain user credentials')
	}
}
